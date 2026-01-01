"""
Release Builder for Browser Extensions
=======================================

This script automates the creation of release packages for distribution.

PURPOSE:
    Generate optimized, tarball-ready ZIP archives for different distribution channels.

WHY SEPARATE PACKAGES?
    Generating platform-specific builds is a professional standard for Cross-Browser extensions:
    1.  Manifest Compliance: Automatically handles incompatible keys (e.g., Chrome's
        'service_worker' vs Firefox's 'background.scripts') and required metadata like 'gecko.id'.
    2.  UX Adaptation: Firefox has unique limitations (e.g., popups closing during file selection).
        Separate builds allow including specific UI workarounds like 'options.html' redirection
        without cluttering the Chrome experience.
    3.  Store Review & Trust: Human reviewers and automated scanners (AMO/Web Store) prefer
        clean, browser-specific code. This reduces flags, avoids 'dead code' warnings,
        and significantly speeds up the approval cycle.
    4.  API Consistency: Ensures that browser-specific API implementations (Promise-based
        for Firefox vs Callback-based for Chrome) are properly scoped.

OUTPUTS:
    Creates ZIP files in the 'releases' folder:
    - {name}-v{version}-chrome.zip  -> Minimal package for Chrome Web Store.
    - {name}-v{version}-firefox.zip -> Optimized package for Firefox (AMO).
    - {name}-v{version}.zip         -> Full source package for GitHub Releases.

USAGE:
    python scripts/build_release.py              # Build all
    python scripts/build_release.py --bump patch # Increment version and build
    python scripts/build_release.py --no-firefox # Chrome only

NOTES:
    - Metadata is sourced from manifest.json.
    - Firefox manifest is dynamically generated from the Chrome source.
    - Extension names are automatically slugified (e.g., "My App" -> "my-app").
"""

import os
import json
import zipfile
import re
import argparse
import tempfile
import shutil
import copy
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

MANIFEST_FILE = 'manifest.json'


class Manifest:
    """Represents the extension manifest.json file."""
    
    def __init__(self, path: Path):
        """Load manifest from file."""
        self.path = path
        self._data = self._load()
    
    def _load(self) -> Dict[str, Any]:
        """Read and parse manifest.json."""
        try:
            with open(self.path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error loading manifest: {e}")
            raise SystemExit(1)
    
    def _save(self) -> None:
        """Write manifest.json back to disk."""
        with open(self.path, 'w', encoding='utf-8') as f:
            json.dump(self._data, f, indent=4, ensure_ascii=False)
    
    @property
    def name(self) -> str:
        """Extension name."""
        return self._data.get('name', 'extension')
    
    @property
    def slug(self) -> str:
        """URL-friendly name (lowercase, hyphenated)."""
        name = self.name.lower()
        name = re.sub(r'[^a-z0-9]+', '-', name)
        return name.strip('-')
    
    @property
    def version(self) -> str:
        """Extension version."""
        return self._data.get('version', '0.0.0')
    
    @version.setter
    def version(self, value: str):
        """Set extension version and save."""
        self._data['version'] = value
        self._save()
    
    @property
    def description(self) -> str:
        """Extension description."""
        return self._data.get('description', '')
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get any manifest property."""
        return self._data.get(key, default)
    
    def to_firefox_manifest(self) -> Dict[str, Any]:
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
                'id': 'youtube-interaction-manager@fastfingertips',
                'strict_min_version': '109.0'
            }
        }
        
        return firefox_data
    
    def bump_version(self, bump_type: str = 'patch') -> Tuple[str, str]:
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
    CHROME_FILES = [MANIFEST_FILE, 'src']
    
    # Documentation files (added for GitHub release)
    DOCS_FILES = ['README.md', 'PRIVACY.md', 'LICENSE', 'CHANGELOG.md']
    
    # Patterns to exclude from all packages
    EXCLUDE_PATTERNS = [
        '__pycache__', '.git', '.agent', '.workflows',
        '.gitignore', '.gitattributes', 'node_modules',
        'releases', 'docs', 'scripts', '.vscode', '.idea',
        '*.zip', '*.pyc', '.DS_Store', 'Thumbs.db'
    ]
    
    def __init__(self, project_root: Optional[Path] = None):
        """Initialize builder with project root directory."""
        # Script is in scripts/, so go up one level for project root
        self.project_root = project_root or Path(__file__).resolve().parent.parent
        self.output_dir = self.project_root / 'releases'
        
        # Load manifest
        self.manifest = Manifest(self.project_root / MANIFEST_FILE)
    
    def _should_exclude(self, path: Path) -> bool:
        """Check if a path should be excluded from the package."""
        name = path.name
        # Match against patterns (supports *extension) or check parent directory names
        matches_pattern = any(name.endswith(p[1:]) if p.startswith('*') else name == p for p in self.EXCLUDE_PATTERNS)
        in_hidden_dir = any(part in self.EXCLUDE_PATTERNS for part in path.parts)
        
        return matches_pattern or in_hidden_dir

    def _clean_zip(self, filepath: Path) -> None:
        """Safe remove existing zip file."""
        if filepath.exists():
            try:
                filepath.unlink()
            except PermissionError:
                print(f"\n  Error: Cannot overwrite {filepath.name}. File might be open.")
                raise SystemExit(1)

    def _add_to_zip(self, zipf: zipfile.ZipFile, source: Path, arcname: Optional[str] = None):
        """Add file or directory to ZIP."""
        if self._should_exclude(source):
            return

        target_name = arcname or source.name
        if source.is_file():
            zipf.write(source, target_name)
        elif source.is_dir():
            for item in source.rglob('*'):
                if not self._should_exclude(item):
                    zipf.write(item, Path(target_name) / item.relative_to(source))

    def _create_package(self, files: List[str], suffix: str = '') -> Path:
        """Common logic for creating a standard package."""
        filename = f'{self.manifest.slug}-v{self.manifest.version}{suffix}.zip'
        filepath = self.output_dir / filename
        self._clean_zip(filepath)
        
        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for item_name in files:
                source = self.project_root / item_name
                if source.exists():
                    self._add_to_zip(zipf, source)
        
        return filepath

    def build_chrome_package(self) -> Path:
        """Create package for Chrome Web Store."""
        return self._create_package(self.CHROME_FILES, '-chrome')
    
    def build_github_package(self) -> Path:
        """Create package for GitHub Release."""
        return self._create_package(self.CHROME_FILES + self.DOCS_FILES)
    
    def build_firefox_package(self) -> Path:
        """Create specialized package for Firefox."""
        filename = f'{self.manifest.slug}-v{self.manifest.version}-firefox.zip'
        filepath = self.output_dir / filename
        self._clean_zip(filepath)

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            
            # Copy base files
            for item_name in self.CHROME_FILES:
                src = self.project_root / item_name
                dst = tmp_path / item_name
                if src.is_dir():
                    shutil.copytree(src, dst, ignore=shutil.ignore_patterns(*self.EXCLUDE_PATTERNS))
                else:
                    shutil.copy2(src, dst)
            
            # Patch manifest
            firefox_manifest = self.manifest.to_firefox_manifest()
            with open(tmp_path / MANIFEST_FILE, 'w', encoding='utf-8') as f:
                json.dump(firefox_manifest, f, indent=4, ensure_ascii=False)
            
            # Zip it
            with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for item in tmp_path.rglob('*'):
                    if item.is_file():
                        zipf.write(item, item.relative_to(tmp_path))
        
        return filepath
    
    def build_all(self, include_firefox: bool = True) -> Dict[str, Any]:
        """Run all build steps."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        result = {
            'info': {
                'name': self.manifest.name,
                'version': self.manifest.version,
                'description': self.manifest.description,
            },
            'paths': {
                'chrome': self.build_chrome_package(),
                'github': self.build_github_package()
            },
            'output_dir': self.output_dir
        }
        
        if include_firefox:
            result['paths']['firefox'] = self.build_firefox_package()
            
        return result

    @staticmethod
    def format_size(path: Path) -> str:
        """Format file size in human readable format."""
        size = float(path.stat().st_size)
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    def print_summary(self, result: Dict[str, Any]):
        """Print build summary in a simple, readable format."""
        print(f"\nBuild Complete: {result['info']['name']} (v{result['info']['version']})")
        print("-" * 60)
        
        for platform, path in result['paths'].items():
            print(f"{platform.capitalize():<10} : {path.name} ({self.format_size(path)})")
            
        print("-" * 60)
        print(f"Output     : {result['output_dir']}\n")


def main():
    """Entry point for the release builder."""
    parser = argparse.ArgumentParser(description='Build release packages for browser extensions')
    parser.add_argument('--bump', choices=['major', 'minor', 'patch'], help='Bump version')
    parser.add_argument('--no-firefox', action='store_true', help='Exclude Firefox package')
    parser.add_argument('--no-open', action='store_true', help='Do not open output folder')
    
    args = parser.parse_args()
    builder = ReleaseBuilder()
    
    if args.bump:
        old_v, new_v = builder.manifest.bump_version(args.bump)
        print(f"Version bumped: {old_v} -> {new_v}\n")
    
    result = builder.build_all(include_firefox=not args.no_firefox)
    builder.print_summary(result)
    
    if not args.no_open and os.name == 'nt':
        os.startfile(result['output_dir'])


if __name__ == '__main__':
    main()
