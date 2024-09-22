import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";
import Template from "./block_selector_dialog.blp";
import { BlockSchema, allBlockSchemas } from "../schema.js";
import { BlockSelectorItem } from "./block_selector_item.js";

export class BlockSelectorDialog extends Adw.Dialog {
	private _listview!: Gtk.ListView;
	private _searchEntry!: Gtk.SearchEntry;

	static {
		GObject.registerClass({
			GTypeName: "WfBlockSelectorDialog",
			Template: Template,
			InternalChildren: [
				"listview",
				"searchEntry",
			],
			Signals: {
				"block-selected": {
					param_types: [GObject.TYPE_OBJECT],
				},
			},
		}, this);
	}

	constructor() {
		super();

		allBlockSchemas().then((store) => {
			this._listview.model = new Gtk.NoSelection({
				model: store,
			});
		});

		this._listview.connect("activate", (listview: Gtk.ListView, pos: number) => {
			this.emit("block-selected", listview.model.get_item(pos));
			this.close();
		});

		const factory = new Gtk.SignalListItemFactory();
		this._listview.factory = factory;

		factory.connect("setup", (_: GObject.Object, listItem: Gtk.ListItem) => {
			listItem.child = new BlockSelectorItem();
		});
		factory.connect("bind", (_: GObject.Object, listItem: Gtk.ListItem) => {
			const schema = listItem.item as BlockSchema;
			const child = listItem.child as BlockSelectorItem;
			child.schema = schema;
		});
	}

	present(parent: Gtk.Widget) {
		super.present(parent);
		this._searchEntry.grab_focus();
	}
}
