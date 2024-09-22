gnome = import('gnome')

blpcmp_path = find_program('blueprint-compiler').full_path()

esbuild_env = [
	'OUTPUT_DIR=' + meson.project_build_root() / 'esbuild-out',
	'ENTRY_POINT=' + meson.project_source_root() / 'src' / 'main.ts',
	'BLUEPRINT_COMPILER=' + blpcmp_path,
]
esbuild_script = meson.project_source_root() / 'esbuild.mjs'

typecheck_bundle = custom_target(
	'typescript-compile',
	input: files('main.ts'),
	build_by_default: true,
	build_always_stale: true,
	command: [
		'env',
		esbuild_env,
		find_program('node'),
		esbuild_script,
	],
	output: 'esbuild-out',
)

src_res = gnome.compile_resources(
	'io.github.flying_toast.Workflows.src',
	'src.gresource.xml',
	dependencies: typecheck_bundle,
	source_dir: meson.project_build_root() / 'esbuild-out',
	gresource_bundle: true,
	install: true,
	install_dir: pkgdatadir,
)

bin_conf = configuration_data()
bin_conf.set('GJS', gjs_console)
bin_conf.set('PACKAGE_VERSION', meson.project_version())
bin_conf.set('PACKAGE_NAME', meson.project_name())
bin_conf.set('prefix', get_option('prefix'))
bin_conf.set('libdir', join_paths(get_option('prefix'), get_option('libdir')))
bin_conf.set('datadir', join_paths(get_option('prefix'), get_option('datadir')))
bin_conf.set('resource_path', '/io/github/flying_toast/Workflows')

app_launcher = configure_file(
	input: 'io.github.flying_toast.Workflows.in',
	output: 'io.github.flying_toast.Workflows',
	configuration: bin_conf,
	install: true,
	install_dir: get_option('bindir')
)

run_target(
	'devel',
	command: [gjs_console, '-m', app_launcher],
	depends: [src_res, data_res, compile_local_schemas]
)
