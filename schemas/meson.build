schemas_dir = pkgdatadir / 'schemas'

blocks = run_command([
	'find',
	'blocks',
	'-name',
	'*.json',
]).stdout().strip().split('\n')

triggers = run_command([
	'find',
	'triggers',
	'-name',
	'*.json',
]).stdout().strip().split('\n')

dbus = run_command([
	'find',
	'dbus',
	'-name',
	'*.json',
]).stdout().strip().split('\n')

install_data(
	files(blocks),
	install_dir: schemas_dir / 'blocks',
)

install_data(
	files(triggers),
	install_dir: schemas_dir / 'triggers',
)

install_data(
	files(dbus),
	install_dir: schemas_dir / 'dbus',
)
