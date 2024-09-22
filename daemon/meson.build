cargo = find_program('cargo')

cargo_env = [ 'CARGO_HOME=' + meson.project_build_root() / 'cargo-home' ]

custom_target(
	'cargo-build',
	build_by_default: true,
	build_always_stale: true,
	output: 'workflows-daemon',
	console: true,
	install: true,
	install_dir: get_option('bindir'),
	command: [
		'env',
		cargo_env,
		cargo,
		'build',
		[
			'--target-dir', meson.project_build_root() / 'daemon',
			'--manifest-path', meson.project_source_root() / 'daemon' / 'Cargo.toml',
			# TODO: build in release mode
			# '--release',
		],
		'&&',
		'cp',
		# TODO: release mode
		'daemon' / 'debug' / 'workflows-daemon',
		'daemon' / 'workflows-daemon',
	]
)
