# UV Scripts Guide - Complete Documentation

## Running Scripts

A Python script is designed for standalone execution (e.g., `python <script>.py`). Using uv ensures script dependencies are managed automatically without manual environment configuration.

**Key Note:** uv automatically manages virtual environments and prefers a declarative approach to dependencies, eliminating the need for manual virtual environment creation.

## Running Scripts Without Dependencies

Execute simple scripts using `uv run`:

```python
print("Hello world")
```

```bash
$ uv run example.py
Hello world
```

Scripts using standard library modules work the same way:

```python
import os
print(os.path.expanduser("~"))
```

### Passing Arguments

Scripts accept command-line arguments:

```python
import sys
print(" ".join(sys.argv[1:]))
```

```bash
$ uv run example.py test
test

$ uv run example.py hello world!
hello world!
```

### Reading from stdin

Scripts can be piped or provided via here-documents:

```bash
$ echo 'print("hello world!")' | uv run -

uv run - <<EOF
print("hello world!")
EOF
```

### Project Context

When using `uv run` in a project directory (containing `pyproject.toml`), the project installs before running. To skip this:

```bash
$ uv run --no-project example.py
```

## Running Scripts With Dependencies

External packages require explicit declaration. uv creates environments on-demand rather than maintaining long-lived virtual environments.

### Using the --with Option

For a script requiring `rich`:

```bash
$ uv run --with rich example.py
```

With version constraints:

```bash
$ uv run --with 'rich>12,<13' example.py
```

Multiple dependencies are added by repeating `--with`:

```bash
$ uv run --with package1 --with package2 example.py
```

## Creating Python Scripts

Initialize scripts with inline metadata using:

```bash
$ uv init --script example.py --python 3.12
```

## Declaring Script Dependencies

PEP 723 inline metadata format allows dependencies within the script itself.

### Adding Dependencies

Use `uv add --script` to declare dependencies:

```bash
$ uv add --script example.py 'requests<3' 'rich'
```

This creates a `script` section at the script's top:

```python
# /// script
# dependencies = [
#   "requests<3",
#   "rich",
# ]
# ///

import requests
from rich.pretty import pprint

resp = requests.get("https://peps.python.org/api/peps.json")
data = resp.json()
pprint([(k, v["title"]) for k, v in data.items()][:10])
```

Run with automatic dependency installation:

```bash
$ uv run example.py
```

**Important:** When inline metadata is present, project dependencies are ignored—the `--no-project` flag isn't required.

### Python Version Requirements

Specify Python version requirements:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

type Point = tuple[float, float]
print(Point)
```

uv downloads required Python versions if not installed.

## Using Shebangs for Executable Scripts

Make scripts executable without `uv run`:

```bash
#!/usr/bin/env -S uv run --script

print("Hello, world!")
```

Make executable and run:

```bash
$ chmod +x greet
$ ./greet
Hello, world!
```

### With Dependencies

```bash
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx"]
# ///

import httpx
print(httpx.get("https://example.com"))
```

## Using Alternative Package Indexes

Specify custom package indexes:

```bash
$ uv add --index "https://example.com/simple" --script example.py 'requests<3' 'rich'
```

This adds index configuration to inline metadata:

```python
# [[tool.uv.index]]
# url = "https://example.com/simple"
```

Refer to package index documentation for authentication details.

## Locking Dependencies

Lock PEP 723 script dependencies explicitly:

```bash
$ uv lock --script example.py
```

This creates an adjacent `.lock` file (e.g., `example.py.lock`). Subsequent `uv run --script`, `uv add --script`, `uv export --script`, and `uv tree --script` operations reuse locked dependencies.

## Improving Reproducibility

Add an `exclude-newer` field to limit distributions by release date:

```python
# /// script
# dependencies = [
#   "requests",
# ]
# [tool.uv]
# exclude-newer = "2023-10-16T00:00:00Z"
# ///

import requests
print(requests.__version__)
```

Use RFC 3339 timestamp format (e.g., `2006-12-02T02:07:43Z`).

## Using Different Python Versions

Request specific Python versions per invocation:

```bash
$ uv run example.py
3.12.6

$ uv run --python 3.10 example.py
3.10.15
```

See Python version request documentation for details.

## Using GUI Scripts

On Windows, `.pyw` extension files run via `pythonw`:

```python
from tkinter import Tk, ttk

root = Tk()
root.title("uv")
frm = ttk.Frame(root, padding=10)
frm.grid()
ttk.Label(frm, text="Hello World").grid(column=0, row=0)
root.mainloop()
```

```bash
PS> uv run example.pyw
```

GUI scripts work with dependencies as well:

```python
import sys
from PyQt5.QtWidgets import QApplication, QWidget, QLabel, QGridLayout

app = QApplication(sys.argv)
widget = QWidget()
grid = QGridLayout()

text_label = QLabel()
text_label.setText("Hello World!")
grid.addWidget(text_label)

widget.setLayout(grid)
widget.setGeometry(100, 100, 200, 50)
widget.setWindowTitle("uv")
widget.show()
sys.exit(app.exec_())
```

```bash
PS> uv run --with PyQt5 example_pyqt.pyw
```

## Next Steps

For more information on `uv run`, consult the command reference or learn about running and installing tools with uv.
