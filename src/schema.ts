import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Gio from "gi://Gio";

export class BlockSchema extends GObject.Object {
	#label: string;
	#description: string;
	#tag: string;
	#params: ParamSchema[];

	static {
		GObject.registerClass({
			GTypeName: "WfBlockSchema",
		}, this);
	}

	constructor(args: {
		tag: string,
		label: string,
		description: string,
		params: ParamSchema[],
	}) {
		super();
		this.#tag = args.tag;
		this.#label = args.label;
		this.#description = args.description;
		this.#params = args.params;
	}

	get label(): string {
		return this.#label;
	}

	get description(): string {
		return this.#description;
	}

	get params(): ParamSchema[] {
		return this.#params;
	}

	static fromJSON(string: string): BlockSchema | null {
		try {
			const obj: any = JSON.parse(string);
			const params = getArray(obj, "params");
			const parsedParams = [];
			for (const i of params) {
				const param = ParamSchema.fromObj(i);
				if (param != null) {
					parsedParams.push(param);
				} else {
					throw new Error();
				}
			}
			return new BlockSchema({
				tag: getString(obj, "tag"),
				label: getString(obj, "label"),
				description: getString(obj, "description"),
				params: parsedParams,
			});
		} catch (e: any) {
			console.error(e);
			return null;
		}
	}
}

export class ParamSchema {
	#tag: string;
	#label: string;
	#description: string;
	#typeRestriction: TypeRestriction;

	constructor(args: {
		tag: string,
		label: string,
		description: string,
		typeRestriction: TypeRestriction,
	}) {
		this.#tag = args.tag;
		this.#label = args.label;
		this.#description = args.description;
		this.#typeRestriction = args.typeRestriction;
	}

	get tag(): string {
		return this.#tag;
	}

	get label(): string {
		return this.#label;
	}

	get description(): string {
		return this.#description;
	}

	get typeRestriction(): TypeRestriction {
		return this.#typeRestriction;
	}

	static fromObj(obj: any): ParamSchema | null {
		try {
			return new ParamSchema({
				tag: getString(obj, "tag"),
				label: getString(obj, "label"),
				description: getString(obj, "description"),
				typeRestriction: getTypeRestriction(obj, "typeRestriction"),
			});
		} catch (e: any) {
			console.error(e);
			return null;
		}
	}
}

export class TypeRestriction {
	#allowsStr: boolean;
	#allowsNum: boolean;
	#allowsBool: boolean;

	constructor(str: boolean, num: boolean, bool: boolean) {
		this.#allowsStr = str;
		this.#allowsNum = num;
		this.#allowsBool = bool;
	}

	static fromAny(any: any): TypeRestriction | null {
		if (any == null) {
			return new TypeRestriction(true, true, true);
		}
		let str = false;
		let num = false;
		let bool = false;
		if (any instanceof Array) {
			for (const i of any) {
				switch (i) {
					case "Num":
						num = true;
						break;
					case "Str":
						str = true;
						break;
					case "Bool":
						bool = true;
						break;
					default:
						console.error(`Unknown TypeRestriction ${i}`);
						return null;
						break;
				}
			}
			return new TypeRestriction(str, num, bool);
		} else {
			return null;
		}
	}

	get allowsVar() {
		return true;
	}

	get allowsStr() {
		return this.#allowsStr;
	}

	get allowsNum() {
		return this.#allowsNum;
	}

	get allowsBool() {
		return this.#allowsBool;
	}
}

let blockCache: Gio.ListStore<BlockSchema> | null = null;
export async function allBlockSchemas(): Promise<Gio.ListStore<BlockSchema>> {
	if (blockCache == null) {
		blockCache = new Gio.ListStore({ item_type: BlockSchema.$gtype });
		const schemas = await readAllSchemas("blocks");

		for (const schemaJSON of schemas) {
			const parsed = BlockSchema.fromJSON(schemaJSON);
			if (parsed != null) {
				blockCache.append(parsed);
			} else {
				console.error(`error parsing schema:\n${schemaJSON}`);
			}
		}
	}
	return blockCache;
}

async function readAllSchemas(schemasSubdir: string): Promise<string[]> {
		const dir = Gio.File.new_build_filenamev([pkg.pkgdatadir!, "schemas", schemasSubdir]);
		const diriter = await (dir.enumerate_children_async(
			"standard::*",
			Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
			GLib.PRIORITY_DEFAULT,
			null,
		) as unknown as Promise<Gio.FileEnumerator>);

		const ret = [];

		const decoder = new TextDecoder("utf-8");
		for (;;) {
			const infos = await (diriter.next_files_async(50, GLib.PRIORITY_DEFAULT, null) as unknown as Promise<Gio.FileInfo[]>);
			if (infos.length == 0) {
				break;
			}
			for (const i of infos) {
				const file = dir.get_child(i.get_name());
				const [contents, _etag] = await (file.load_contents_async(null) as unknown as Promise<[any, any]>);
				const text = decoder.decode(contents);
				ret.push(text);
			}
		}

		return ret;
}

function getTypeRestriction(obj: any, key: string): TypeRestriction {
	const ret = TypeRestriction.fromAny(obj[key]);
	if (ret == null) {
		throw new Error(`failed to get TypeRestriction with key ${key}`);
	}
	return ret;
}

function getString(obj: any, key: string): string {
	if (key in obj) {
		let x = obj[key];
		if (typeof x == "string") {
			return x;
		}
	}
	throw new Error(`failed to get string with key ${key}`);
}

function getArray(obj: any, key: string): any[] {
	if (key in obj) {
		let x = obj[key];
		if (x instanceof Array) {
			return x;
		}
	}
	throw new Error(`failed to get array with key ${key}`);
}
