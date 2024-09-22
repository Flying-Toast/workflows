import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";
import Template from "./sidebar.blp";
import { WfWindow } from "../window.js";
import { Workflow } from "../workflow.js";
import { WorkflowListItem } from "./workflow_list_item.js";

export class Sidebar extends Adw.NavigationPage {
	#workflows: Gio.ListStore<Workflow>;
	private _listview!: Gtk.ListView;
	private _statuspage!: Adw.StatusPage;

	static {
		GObject.registerClass({
			GTypeName: "WfSidebar",
			Template: Template,
			InternalChildren: [
				"listview",
				"statuspage",
			],
			Signals: {
				"workflow-selected": {
					param_types: [GObject.TYPE_OBJECT],
				},
			},
		}, this);
	}

	constructor() {
		super();
		this.#workflows = new Gio.ListStore({ item_type: Workflow.$gtype });
		this.#workflows.connect("notify::n-items", () => {
			this._statuspage.visible = (this.#workflows.n_items == 0);
		});

		const model = new Gtk.SingleSelection({
			model: this.#workflows,
			autoselect: false,
		});
		this._listview.model = model;

		model.connect("selection-changed", () => {
			this.emit("workflow-selected", this.#workflows.get_item(model.selected));
		});

		const factory = new Gtk.SignalListItemFactory();
		this._listview.factory = factory;

		factory.connect("setup", (_fact, o) => {
			const listItem = o as Gtk.ListItem;
			listItem.child = new WorkflowListItem();
		});
		factory.connect("bind", (_fact, o) => {
			const listItem = o as Gtk.ListItem;
			const workflow = listItem.item as Workflow;
			const child = listItem.child as WorkflowListItem;
			child.workflow = workflow;
			this.#addItemActions(listItem);
		});
	}

	addNewWorkflow() {
		this.#workflows.append(new Workflow(_!("Unnamed Workflow")));
	}

	#addItemActions(listItem: Gtk.ListItem) {
		const child = listItem.child as WorkflowListItem;

		const actions = new Gio.SimpleActionGroup();
		child.insert_action_group("workflow-item", null);
		child.insert_action_group("workflow-item", actions);

		const onDelete = (_act: Gio.SimpleAction) => {
			const removedIndex = listItem.position;
			const removedWorkflow = this.#workflows.get_item(removedIndex)! as Workflow;
			this.#workflows.remove(removedIndex);

			const toastTitle = _!("\"{}\" Deleted").replace("{}", removedWorkflow.name);
			const toast = new Adw.Toast({ title: toastTitle });
			toast.button_label = _!("Undo");
			toast.connect(
				"button-clicked",
				(_toast) => {
					// try to add it back to the index it was removed from,
					// otherwise just append it
					if (this.#workflows.n_items > removedIndex) {
						this.#workflows.insert(removedIndex, removedWorkflow);
					} else {
						this.#workflows.append(removedWorkflow);
					}
				},
			);
			(this.root as WfWindow).addToast(toast);
		};

		actions.add_action_entries([
			{
				name: "rename",
				activate: (_act: Gio.SimpleAction) => child.startNameEdit(),
			} as unknown as Gio.ActionEntry,
			{
				name: "delete",
				activate: onDelete,
			} as unknown as Gio.ActionEntry,
		]);
	}
}
