Release history
===============

Version 0.27.0
--------------

Merged with ``compass-interface-core``.

Reorganised to per-subpackage directories.

Version 0.26.0
--------------

Drastically improved dockerfile (made it much smaller too).

Centralised API error codes for consistency.

Version 0.25.0
--------------

Removed redis support.

Version 0.24.1
--------------

Updated pin on ``compass-interface-core`` to ``0.20.0`` (fix missed files).

Version 0.24.0
--------------

Removed ``compass.util.cache``.

Updated pin on ``compass-interface-core`` to ``0.20.0``.

Updated JS sources to Compass version 4.07.

Added script to automatically update Compass JS sources.

Version 0.23.2
--------------

Fixed packaging to include JSON resources.

Version 0.23.1
--------------

Updated pin on ``compass-interface-core`` to ``0.15.1``.

Added more hierarchy API endpoints.

Version 0.23.0
--------------

Renamed ``compass.api.utility`` to ``compass.api.util`` for consistency with
``compass-interface-core``.

Moved http error handling to ``compass.api.util.http_errors``.

Updated pin on ``compass-interface-core`` to ``0.14.1``.

Added ``compass/api/resources/hierarchy_flat.json`` and
``compass.api.util.flatten_units``.

Added initial hierarchy API endpoints.


Version 0.22.10
---------------

Updated pin on ``compass-interface-core`` to ``0.13.1``.

Added error handling context manager.

Version 0.22.9
--------------

Fixed accidental overwriting of ``username`` argument.

Version 0.22.8
--------------

Added automatic deploy workflow through GitHub Actions.

Added logging throughout.

Version 0.22.7
--------------

Updated pin on ``compass-interface-core`` to ``0.13.0``.

Fix packaging metadata.

Moved cache implementation to ``compass.util.cache``

Version 0.22.6
--------------

Fixed automatic release workflow (take two).

Version 0.22.5
--------------

Fixed automatic release workflow.

Updated badges in README.

Version 0.22.4
--------------

Updated pin on ``compass-interface-core`` to ``0.9.3``.

Added ``compass.api.utility.oauth2.people_accessor``.

Added several ``/me/<accessor>`` accessors (awards, disclosures, latest disclosure)

Changed redis management to use a ``Starlette`` lifetime.

Version 0.22.3
--------------

Refactored redis support to ``compass.api.plugins.redis``.

Version 0.22.2
--------------

Removed ``script.py``.

Centralised docker configuration in ``docker/``.

Updated README with docker information and new installation instructions.

Version 0.22.1
--------------

Fixed errors in automatic release workflow.

Version 0.22.0
--------------

Removed:
- ``compass.api.utility.compass_people_interface``.
- ``compass.api.utility.tables``.
- ``compass.api.utility.redis_handler.RedisConfig``.

Added:
- ``role_details_all_csv_to_json`` in ``script.py``.
- logic for ``/permits`` API endpoint.
- automatic release workflow through GitHub Actions.

Changed:
- Normalised imports to fully-qualified style.
- Updated type hints.
- Updated pin on ``compass-interface-core`` to ``0.8.0``.
- Renamed ``report_to_sql`` in ``compass.api.utility.reports_interface`` to
``report_to_feather``.

Fixed API authentication.

Version 0.21.0
--------------

Updated pin on ``compass-interface-core`` to ``0.5.0``.

Added packaging configuration.

Version 0.20.0
--------------

Moved ``compass.util`` to this project.

General formatting changes (``black`` and ``isort``).

Version 0.19.0
--------------

Moved to namespace packages:
- ``api`` -> ``compass.api``
- ``interface`` -> ``compass.interface``

Switched to using ``p3x-redis-ui`` over ``redisinsight`` for docker.

Version 0.18.0
--------------

Updated JS sources to Compass version 4.06.

Updated requirements.txt

Version 0.17.0
--------------

Moved to using docker-hub images for *scouts/compass-interface-backend*

Updated the licence for 2021.

Integrated ``compass-interface-core``:
- Removed split out ``compass.core`` modules
- Removed certificate files
- Updated README
- Added ``isort`` configuration
- Switched to using ``compass.core`` classes, functions, etc

Version 0.16.4
--------------

Added ``requirements.txt`` for pip as an alternative to conda.

Simplified dockerfile.

.. note:: **compass-interface-core** initially branched from this point.

Version 0.16.3
--------------

Unify project descriptions between FastAPI and README.

Added initial docker support with a dockerfile for the backend and settings for
docker-compose to run the full API and associated services.

Version 0.16.2
--------------

Added project metadata to FastAPI for better automatic documentation.

Updated README with more project information.

Version 0.16.1
--------------

Moved redis lifetime handling into ``api.utility.redis_handler``.

Version 0.16.0
--------------

Created ``compass.settings.Settings``.

Version 0.15.8
--------------

Moved compass authorisation header logic to ``compass.logon``.

Version 0.15.7
--------------

Moved ``utility.jk_hash`` to ``compass.logon``.

Version 0.15.6
--------------

Renamed API endpoint function names for better automatic documentation.

Version 0.15.5
--------------

Moved logic for api ongoing learning wrangling to
``api.utility.compass_people_interface``.

Version 0.15.4
--------------

Added ``/me/ongoing-training`` API endpoint.

Version 0.15.3
--------------

Added option to only get mandatory ongoing learning information from ``CompassPeopleScraper.get_training_tab``.


Version 0.15.2
--------------

Added ``/me/permits`` API endpoint.

Version 0.15.1
--------------

Added ``/me/roles`` API endpoint.

Version 0.15.0
--------------

Changed return type of ``/me`` API endpoint to ``Member`` model.

Version 0.14.2
--------------

Changed API login flow logic to validate member numbers.

Version 0.14.1
--------------

Removed entire jQuery source from JS sources.

Added ``CompassPeople.get_roles``.

Version 0.14.0
--------------

Integrated authentication against Compass into the API.

Version 0.13.9
--------------

Added logic to ``/me`` API endpoint.

Fixed import location.

Version 0.13.8
--------------

Added oauth2 utility functions in ``api.utility``.

Version 0.13.7
--------------

Added experimental ``PeriodicTimer`` class.

Version 0.13.6
--------------

Migrated to using custom ``CompassError`` exception types in ``compass.logon``.

Version 0.13.5
--------------

Wrote redis cache plugin.

Version 0.13.4
--------------

Updated installation instructions.

Created ``api.schemas.auth``.

Version 0.13.3
--------------

Added custom exception types for the ``compass`` module.

Version 0.13.2
--------------

Moved ``api.database.interface`` to ``api.utility.reports_interface`` and
combine with ``api.database.database``.

Moved ``api.database.tables`` to ``api.utility.tables``,

Version 0.13.1
--------------

Updated metadate:
- use strong emphasis for venv suggestion
- added progress to API routes sketch
- simplified ``.gitignore``.
- renamed ``certs/`` to ``certificates/``

Version 0.13.0
--------------

Added installation instructions in README.

Version 0.12.2
--------------

Fixed mandatory ongoing learning API endpoint.

Added mandatory ongoing learning schema.

Version 0.12.1
--------------

Increased type strictness in ``api.schemas.member``.

Added (broken) mandatory ongoing learning API endpoint.

Version 0.12.0
--------------

Updated project metadata:
- Added licence information (MIT)
- Expanded README
- Updated dependencies

Added logic for member roles endpoint.

Version 0.11.1
--------------

Fixed bug in project root detection.

Version 0.11.0
--------------

Added main API router.

Added sketch of proposed API routes.

Version 0.10.6
--------------

Added draft of initial API routes for member accessors.

Version 0.10.5
--------------

Added draft of API database functionality.

Version 0.10.4
--------------

Added custom exception types for reports.

``reports.get_report`` now returns bytes.

Version 0.10.3
--------------

Added first pydantic schemas for member types.

Version 0.10.2
--------------

Enabled SSL checks

Version 0.10.1
--------------

Fixed invalid certificates error by vendoring certificates.

Version 0.10.0
--------------

Namespaced modules as ``compass.*``.

Version 0.9.9
-------------

Created ``compass_reports``.

Version 0.9.8
-------------

Move ``compass_read`` to ``interface``.

First working report exports (Regional Appointments Report).

Version 0.9.7
-------------

Removed ``safe_xpath``.

Version 0.9.6
-------------

Moved ``compass_people.cast`` to ``utility``.

Added return type hints to some functions in ``compass_people``.

Version 0.9.5
-------------

Moved training parsing from ``CompassPeople`` to ``CompassPeopleScraper``.

Version 0.9.4
-------------

Moved roles parsing from ``CompassPeople`` to ``CompassPeopleScraper``.

Version 0.9.3
-------------

Moved permit parsing from ``CompassPeople`` to ``CompassPeopleScraper``.

Version 0.9.2
-------------

Added David Breakwell's ``compassread2.php`` recipe.

Fix requirements file to use Python 3.8.

Added role data properties (``CompassLogon.current_role``,
``CompassLogon.roles_dict``).

Version 0.9.1
-------------

Added ``cast`` function to coerce types.

Version 0.9.0
-------------

Added ``CompassPeopleScraper.get``.

Added permit functions through ``CompassPeopleScraper.get_permits_tab`` and
``CompassPeople._permits_tab``.

Version 0.8.0
-------------

Use ``LiveData`` to get section type.

Rename ``get_units_from_numeric_level`` to
``get_descendants_from_numeric_level``.

Version 0.7.3
-------------

Bugfixes in ``CompassLogon``.

Version 0.7.2
-------------

Broke out ``get_report`` in ``script.py``.

Return PLPs and role data in addition to mandatory learning in
``CompassPeople._training_tab``.

Version 0.7.1
-------------

Generate ``CompassHierarchy.hierarchy_levels`` more dynamically.

Version 0.7.0
-------------

Substantially refactored ``CompassLogon``.

Version 0.6.0
-------------

Standardised interchange format between scraper and interface classes.

Added ``keep_non_volunteer_roles`` argument to ``CompassPeople._roles_tab``

Version 0.5.1
-------------

Fixed imports in ``script.py``

Added common utility methods.

Version 0.5.0
-------------

Refactored ``compass_data`` to modules (``compass_(hierarchy|logon|people)``, ``utility``)

Version 0.4.0
-------------

Changed:
- Moved ``compass_data.py`` to ``src/`` directory

Version 0.3.3
-------------

Added:
- Dependency information in ``environment.yml``
- Configuration for *black*

Standardised variable names in ``script.py``

Version 0.3.2
-------------

Added ``script.py`` file.

Version 0.3.1
-------------

Internal refactor, exposed ``CompassLogon.session`` directly.

Version 0.3.0
-------------

Initial import of the ``compass_data.py`` script into version control.
