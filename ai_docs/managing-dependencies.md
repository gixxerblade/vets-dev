# Managing Dependencies in uv Projects

## Overview

The documentation describes how to manage Python project dependencies using uv's command-line tools. Dependencies are specified in the `pyproject.toml` file and tracked in `uv.lock`.

## Adding Dependencies

You can add packages using the `uv add` command:

```
$ uv add requests
```

The tool supports version constraints and alternative sources:

```
$ uv add 'requests==2.31.0'
$ uv add git+https://github.com/psf/requests
```

For migrating from existing files, you can bulk-add dependencies:

```
$ uv add -r requirements.txt -c constraints.txt
```

## Removing Dependencies

To eliminate a package:

```
$ uv remove requests
```

## Upgrading Packages

Update specific packages while preserving compatibility:

```
$ uv lock --upgrade-package requests
```

As the docs note, this flag "will attempt to update the specified package to the latest compatible version, while keeping the rest of the lockfile intact."

## Key Files

- **pyproject.toml**: Declares broad project requirements and metadata
- **uv.lock**: Contains exact resolved versions; should be version-controlled for reproducible installations

The documentation emphasizes that `uv.lock` is "managed by uv and should not be edited manually."
