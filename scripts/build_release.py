"""
Release Builder for Browser Extensions
=======================================

This script automates the creation of release packages for distribution.

PURPOSE:
    Generate ZIP archives ready for upload to:
    1. Chrome Web Store (Developer Console)
    2. Firefox Add-ons (AMO)
    3. GitHub Releases

OUTPUTS:
    Creates ZIP files in the 'releases' folder:
    
    - {name}-v{version}-chrome.zip
        Minimal package for Chrome Web Store submission.
        Contains only essential extension files.
    
    - {name}-v{version}-firefox.zip
        Package for Firefox Add-ons (AMO) submission.
        Uses background.scripts instead of service_worker.
        
    - {name}-v{version}.zip
        Full package for GitHub Release.
        Contains extension files plus documentation.

USAGE:
    python scripts/build_release.py              # Build all packages (Chrome + Firefox)
    python scripts/build_release.py --no-firefox # Build only Chrome packages
    python scripts/build_release.py --bump patch # Bump 1.2.1 -> 1.2.2

NOTES:
    - All metadata is read from manifest.json
    - Firefox manifest is auto-generated from Chrome manifest
    - Extension name is converted to slug format (lowercase, hyphenated)
    - The 'releases' folder will be created if it doesn't exist

WORKFLOW:
    1. Run with --bump to increment version
    2. Commit and push changes
    3. Upload -chrome.zip to Chrome Developer Console
    4. Upload -firefox.zip to Firefox Add-ons (AMO)
    5. Upload .zip to GitHub Release
"""

import os
import json
import zipfile
import re
import argparse
import tempfile
import shutil
import copy


class Manifest:
    """Represents the extension manifest.json file."""
    
    def __init__(self, path):
        """Load manifest from file."""
        self.path = path
        self._data = self._load()
    
    def _load(self):
        """Read and parse manifest.json."""
        with open(self.path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _save(self):
        """Write manifest.json back to disk."""
        with open(self.path, 'w', encoding='utf-8') as f:
            json.dump(self._data, f, indent=4)
    
    @property
    def name(self):
        """Extension name."""
        return self._data.get('name', 'extension')
    
    @property
    def slug(self):
        """URL-friendly name (lowercase, hyphenated)."""
        name = self.name.lower()
        name = re.sub(r'[^a-z0-9]+', '-', name)
        return name.strip('-')
    
    @property
    def version(self):
        """Extension version."""
        return self._data.get('version', '0.0.0')
    
    @version.setter
    def version(self, value):
        """Set extension version and save."""
        self._data['version'] = value
        self._save()
    
    @property
    def description(self):
        """Extension description."""
        return self._data.get('description', '')
    
    def get(self, key, default=None):
        """Get any manifest property."""
        return self._data.get(key, default)
    
    def to_firefox_manifest(self):
        """
        Convert Chrome manifest to Firefox-compatible format.
        
        Changes:
        - Replace service_worker with background.scripts
        - Add browser_specific_settings for Firefox
        
        Returns:
            dict: Firefox-compatible manifest data
        """
        firefox_data = copy.deepcopy(self._data)
        
        # Convert service_worker to background scripts
        if 'background' in firefox_data:
            bg = firefox_data['background']
            if 'service_worker' in bg:
                script_path = bg.pop('service_worker')
                bg['scripts'] = [script_path]
        
        # Add Firefox-specific settings
        firefox_data['browser_specific_settings'] = {
            'gecko': {
                'id': 'youtube-auto-like@fastfingertips',
                'strict_min_version': '109.0'
            }
        }
        
        return firefox_data
    
    def bump_version(self, bump_type='patch'):
        """
        Increment version number.
        
        Args:
            bump_type: 'major', 'minor', or 'patch'
        
        Returns:
            Tuple of (old_version, new_version)
        """
        old_version = self.version
        parts = old_version.split('.')
        
        # Ensure we have 3 parts
        while len(parts) < 3:
            parts.append('0')
        
        major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
        
        if bump_type == 'major':
            major += 1
            minor = 0
            patch = 0
        elif bump_type == 'minor':
            minor += 1
            patch = 0
        else:  # patch
            patch += 1
        
        new_version = f'{major}.{minor}.{patch}'
        self.version = new_version
        
        return old_version, new_version


class ReleaseBuilder:
    """Handles the creation of release packages for Chrome extensions."""
    
    # Core extension files (required for Chrome Web Store)
    CHROME_FILES = [
        'manifest.json',
        'icons',
        'src',
    ]
    
    # Documentation files (added for GitHub release)
    DOCS_FILES = [
        'README.md',
        'PRIVACY.md',
        'LICENSE',
        'CHANGELOG.md',
    ]
    
    # Patterns to exclude from all packages
    EXCLUDE_PATTERNS = [
        '__pycache__',
        '.git',
        '.gitignore',
        '.gitattributes',
        'node_modules',
        'releases',
        'docs',
        'scripts',
        '.vscode',
        '.idea',
        '*.zip',
        '*.pyc',
        '.DS_Store',
        'Thumbs.db',
    ]
    
    def __init__(self, project_root=None):
        """Initialize builder with project root directory."""
        # Script is in scripts/, so go up one level for project root
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.project_root = project_root or os.path.dirname(script_dir)
        self.output_dir = os.path.join(self.project_root, 'releases')
        
        # Load manifest
        manifest_path = os.path.join(self.project_root, 'manifest.json')
        self.manifest = Manifest(manifest_path)
    
    def _should_exclude(self, path):
        """Check if a path should be excluded from the package."""
        name = os.path.basename(path)
        for pattern in self.EXCLUDE_PATTERNS:
            if pattern.startswith('*'):
                if name.endswith(pattern[1:]):
                    return True
            elif pattern == name or pattern in path.split(os.sep):
                return True
        return False
    
    def _add_to_zip(self, zipf, source, arcname=None):
        """Add a file or directory to the ZIP archive."""
        if arcname is None:
            arcname = os.path.basename(source)
        
        if os.path.isfile(source):
            if not self._should_exclude(source):
                zipf.write(source, arcname)
        elif os.path.isdir(source):
            for root, dirs, files in os.walk(source):
                dirs[:] = [d for d in dirs if not self._should_exclude(d)]
                for file in files:
                    if self._should_exclude(file):
                        continue
                    file_path = os.path.join(root, file)
                    arc_path = os.path.join(arcname, os.path.relpath(file_path, source))
                    zipf.write(file_path, arc_path)
    
    def _create_package(self, files, suffix=''):
        """Create a ZIP package with the specified files."""
        filename = f'{self.manifest.slug}-v{self.manifest.version}{suffix}.zip'
        filepath = os.path.join(self.output_dir, filename)
        
        # Try to remove existing file if it exists
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except PermissionError:
                print(f"\n  Error: Cannot overwrite {filename}")
                print("  The file may be open in another program.")
                print("  Close the file and try again.\n")
                raise SystemExit(1)
        
        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for item in files:
                source = os.path.join(self.project_root, item)
                if os.path.exists(source):
                    self._add_to_zip(zipf, source, item)
        
        return filepath
    
    def _get_existing_files(self, file_list):
        """Filter file list to only existing files."""
        existing = []
        for item in file_list:
            path = os.path.join(self.project_root, item)
            if os.path.exists(path):
                existing.append(item)
        return existing
    
    def build_chrome_package(self):
        """Create minimal package for Chrome Web Store."""
        files = self._get_existing_files(self.CHROME_FILES)
        return self._create_package(files, '-chrome')
    
    def build_github_package(self):
        """Create full package for GitHub Release."""
        chrome_files = self._get_existing_files(self.CHROME_FILES)
        docs_files = self._get_existing_files(self.DOCS_FILES)
        return self._create_package(chrome_files + docs_files)
    
    def build_firefox_package(self):
        """Create package for Firefox Add-ons (AMO)."""
        
        # Create temp directory for Firefox build
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Copy chrome files to temp directory
            files = self._get_existing_files(self.CHROME_FILES)
            for item in files:
                source = os.path.join(self.project_root, item)
                dest = os.path.join(temp_dir, item)
                if os.path.isdir(source):
                    shutil.copytree(source, dest)
                else:
                    shutil.copy2(source, dest)
            
            # Generate Firefox-compatible manifest
            firefox_manifest = self.manifest.to_firefox_manifest()
            manifest_path = os.path.join(temp_dir, 'manifest.json')
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(firefox_manifest, f, indent=4)
            
            # Create ZIP package
            filename = f'{self.manifest.slug}-v{self.manifest.version}-firefox.zip'
            filepath = os.path.join(self.output_dir, filename)
            
            # Remove existing file if present
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except PermissionError:
                    print(f"\n  Error: Cannot overwrite {filename}")
                    print("  The file may be open in another program.")
                    print("  Close the file and try again.\n")
                    raise SystemExit(1)
            
            with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files_list in os.walk(temp_dir):
                    for file in files_list:
                        file_path = os.path.join(root, file)
                        arc_path = os.path.relpath(file_path, temp_dir)
                        zipf.write(file_path, arc_path)
            
            return filepath
        finally:
            # Cleanup temp directory
            shutil.rmtree(temp_dir, ignore_errors=True)
    
    def build_all(self, include_firefox=False):
        """Build multiple platform packages."""
        os.makedirs(self.output_dir, exist_ok=True)
        
        result = {
            'name': self.manifest.name,
            'slug': self.manifest.slug,
            'version': self.manifest.version,
            'description': self.manifest.description,
            'chrome': self.build_chrome_package(),
            'github': self.build_github_package(),
            'output_dir': self.output_dir,
        }
        
        if include_firefox:
            result['firefox'] = self.build_firefox_package()
        
        return result
    
    @staticmethod
    def format_size(bytes_size):
        """Format file size in human readable format."""
        if bytes_size < 1024:
            return f"{bytes_size} B"
        elif bytes_size < 1024 * 1024:
            return f"{bytes_size / 1024:.1f} KB"
        else:
            return f"{bytes_size / (1024 * 1024):.1f} MB"
    
    def print_summary(self, result):
        """Print build summary to console."""
        width = 55
        print("=" * width)
        print(f"  {result['name']} - Release Builder")
        print("=" * width)
        print(f"\n  Version:     {result['version']}")
        print(f"  Description: {result['description'][:40]}...")
        print("\n  Packages:")
        print(f"    Chrome:       {os.path.basename(result['chrome'])}")
        print(f"                  {self.format_size(os.path.getsize(result['chrome']))}")
        if 'firefox' in result:
            print(f"    Firefox:      {os.path.basename(result['firefox'])}")
            print(f"                  {self.format_size(os.path.getsize(result['firefox']))}")
        print(f"    GitHub:       {os.path.basename(result['github'])}")
        print(f"                  {self.format_size(os.path.getsize(result['github']))}")
        print(f"\n  Output: {result['output_dir']}")
        print("=" * width)


def main():
    """Entry point for the release builder."""
    parser = argparse.ArgumentParser(
        description='Build release packages for browser extensions'
    )
    parser.add_argument(
        '--bump',
        choices=['major', 'minor', 'patch'],
        help='Bump version before building (major, minor, or patch)'
    )
    parser.add_argument(
        '--firefox',
        action='store_true',
        help='Include Firefox package in build'
    )
    parser.add_argument(
        '--no-firefox',
        action='store_true',
        help='Exclude Firefox package from build'
    )
    parser.add_argument(
        '--no-open',
        action='store_true',
        help='Do not open output folder after build'
    )
    
    args = parser.parse_args()
    
    builder = ReleaseBuilder()
    
    # Bump version if requested
    if args.bump:
        old_ver, new_ver = builder.manifest.bump_version(args.bump)
        print(f"Version bumped: {old_ver} -> {new_ver}\n")
    
    # Determine if Firefox should be included (default to True)
    include_firefox = not args.no_firefox
    
    # Build packages
    result = builder.build_all(include_firefox=include_firefox)
    builder.print_summary(result)
    
    # Open output folder (Windows)
    if not args.no_open and os.name == 'nt':
        os.startfile(result['output_dir'])


if __name__ == '__main__':
    main()
