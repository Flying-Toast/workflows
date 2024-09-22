import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";
import Template from "./block_info_dialog.blp";
import { BlockSchema, ParamSchema } from "../schema.js";

export class BlockInfoDialog extends Adw.Dialog {
	private _statusPage!: Adw.StatusPage;
	private _paramList!: Gtk.ListBox;

	static {
		GObject.registerClass({
			GTypeName: "WfBlockInfoDialog",
			Template: Template,
			InternalChildren: [
				"statusPage",
				"paramList",
			],
		}, this);
	}

	constructor(schema: BlockSchema) {
		super();
		this._statusPage.title = schema.label;
		this._statusPage.description = schema.description;

		for (const param of schema.params) {
			this._paramList.append(this.#makeParamRow(param));
		}
	}

	#makeParamRow(schema: ParamSchema): Adw.ActionRow {
		const ret = new Adw.ActionRow({
			focusable: false,
			selectable: false,
			activatable: false,
			title: schema.label,
		});
		ret.subtitle = schema.description;
		return ret;
	}
}
