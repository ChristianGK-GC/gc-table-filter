# Geocaching Table Filter

A Tampermonkey userscript that adds inline filtering to geocaching.com tables on search results and cache owner dashboard pages.

---

## Overview

Geocaching Table Filter adds a dynamic filter bar to geocaching.com table pages, allowing you to quickly filter caches by name, type, owner, code, and location. The filter automatically detects which fields are available on each page and adjusts the UI accordingly.

## Filter Fields

| Field    | Description                           | Availability   |
|:---------|:--------------------------------------|:---------------|
| Name     | Cache name                            | All pages      |
| Type     | Cache type (Traditional, Multi, etc.) | All pages      |
| Owner    | Cache owner username                  | Search results |
| Code     | GC code                               | All pages      |
| Location | Geographic location                   | Search results |

## Supported Pages

- `https://www.geocaching.com/play/results*` - Search results
- `https://www.geocaching.com/play/owner/unpublished*` - Unpublished hides

## Installation

### Prerequisites

Install [Tampermonkey](https://www.tampermonkey.net/) in your browser:

- Chrome, Firefox, Safari, Edge, Opera

### Install the Script

1. Install Tampermonkey from the link above
2. Open the [gc-table-filter.user.js](https://github.com/ChristianGK-GC/gc-table-filter/raw/main/gc-table-filter.user.js) file
3. Confirm the installation in Tampermonkey

## Usage

1. Navigate to a supported geocaching.com page
2. The filter bar appears automatically above the cache list
3. Type in any filter field to narrow down results

### Browser Support

Tested and working with:

- Chrome + Tampermonkey
- Firefox + Tampermonkey
- Edge + Tampermonkey

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

GNU General Public License v3.0 - see [LICENSE](LICENSE) for details.
