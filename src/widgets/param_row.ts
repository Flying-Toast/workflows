import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=4.0";
import Template from "./param_row.blp";
import { ParamSchema } from "../schema.js";

export class ParamRow extends Gtk.ListBoxRow {
	private _label!: Gtk.Label;
	#schema: ParamSchema;

	static {
		GObject.registerClass({
			GTypeName: "WfParamRow",
			Template: Template,
			InternalChildren: [
				"label",
			],
		}, this);
	}

	constructor(schema: ParamSchema) {
		super();
		this.#schema = schema;
		this._label.label = schema.label;
	}
}
