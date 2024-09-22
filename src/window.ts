import Adw from "gi://Adw";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Template from "./window.blp";
import { Sidebar } from "./widgets/sidebar.js";
import { Workflow } from "./workflow.js";
import { WorkflowView } from "./widgets/workflow_view.js";

export class WfWindow extends Adw.ApplicationWindow {
	private _sidebar!: Sidebar;
	private _workflowView!: WorkflowView;
	private _navView!: Adw.NavigationSplitView;
	private _toastOverlay!: Adw.ToastOverlay;

	static {
		GObject.registerClass({
			GTypeName: "WfWindow",
			Template: Template,
			InternalChildren: [
				"sidebar",
				"workflowView",
				"navView",
				"toastOverlay",
			],
		}, this);
	}

	constructor(params?: Partial<Adw.ApplicationWindow.ConstructorProps>) {
		super(params);
		new Sidebar();
		new WorkflowView();

		this._sidebar.connect("workflow-selected", (_sidebar, workflow: Workflow) => {
			this._workflowView.workflow = workflow;
			this._navView.activate_action("navigation.push", new GLib.Variant("s", "workflow_view"));
		});
	}

	addToast(toast: Adw.Toast) {
		this._toastOverlay.add_toast(toast);
	}
}
