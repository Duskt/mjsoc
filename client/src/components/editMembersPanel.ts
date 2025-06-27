import Component, { Params } from ".";
import { addMember, editMember, manualRegister, resetSession } from "../request";
import IconButton from "./icons";
import Dialog, { ConfirmationDialog } from "./input/focus/dialog";
import {
    DropdownButton,
    DropdownButtonParameters,
} from "./input/focus/dropdown";

class RemoveMemberButton extends DropdownButton<"div", "button"> {
    constructor(params: DropdownButtonParameters<"div", "button">) {
        super({
            textContent: "-",
            classList: ["member-button"],
            ...params,
        });
        this.update();
    }
    update() {
        this.dropdown.options = window.MJDATA.members.map(
            (m) =>
                new Component({
                    tag: "button",
                    textContent: m.name,
                    other: {
                        onclick: async (ev: MouseEvent) =>
                            editMember({ id: m.id }, this.element),
                    },
                }).element
        );
    }
}

interface AddMemberButtonParams extends Params<"button"> {
    dialogParent: HTMLElement;
}

class AddMemberButton extends Component<"button"> {
    dialog: Dialog;
    form: Component<"form">;
    label: Component<"label">;
    input: Component<"input">;
    submit: Component<"button">;
    constructor(params: AddMemberButtonParams) {
        super({
            tag: "button",
            classList: ["member-button"],
            textContent: "+",
            other: {
                id: "add-member",
            },
            ...params,
        });
        this.dialog = new Dialog({
            activator: this,
            parent: document.body,
            id: "add-member-dialog"
        });
        this.form = new Component({
            tag: "form",
            parent: this.dialog.element,
            id: "new-member-form",
            other: {
                method: "dialog",
                action: "/members",
                enctype: "application/json",
                onsubmit: async (ev) => {
                    ev.preventDefault();
                    let name = new FormData(this.form.element)
                        .get("name")
                        ?.toString();
                    if (!name) {
                        throw Error("no name");
                    }
                    await addMember({ name }, this.form.element);
                },
            },
        });
        this.form.element.addEventListener("mjAddMember", () =>
            this.dialog.deactivate()
        );
        this.label = new Component({
            tag: "label",
            textContent: "New member",
            parent: this.form.element,
            other: {
                htmlFor: "name"
            }
        })
        this.input = new Component({
            tag: "input",
            parent: this.form.element,
            id: "name",
            other: {
                name: "name",
                autocomplete: "name",
                placeholder: "Username"
            }
        });
        this.submit = new Component({
            tag: "button",
            textContent: "Submit",
            parent: this.form.element
        })
    }
}

class Register extends Component<"form"> {
    label: Component<"label">;
    input: Component<"input">;
    datalist: Component<"datalist">;
    constructor(params: Params<"form">) {
        super({
            tag: "form",
            classList: ["register"],
            ...params,
        });
        this.label = new Component({
            tag: "label",
            textContent: "Register",
            parent: this.element,
            other: {
                htmlFor: "register",
            },
        });
        this.datalist = new Component({
            tag: "datalist",
            parent: this.element,
            other: {
                id: "registerList",
            },
        });
        this.updateMembers();
        this.input = new Component({
            tag: "input",
            parent: this.element,
            other: {
                id: "register",
            },
        });
        this.input.element.setAttribute("list", "registerList");
        this.input.element.style["fontSize"] = "14px";
        this.element.onsubmit = (ev) => {
            ev.preventDefault();
            let name = this.input.element.value.trim();
            let members = window.MJDATA.members.filter(
                (m) => m.name.trim() == name
            );
            if (members.length > 1) {
                console.error(`Multiple members named ${name}`);
                alert(
                    "There seem to be multiple members with this name. If this is unlikely, try refreshing. Otherwise, you should rename one, I guess."
                );
                return;
            } else if (members.length === 0) {
                console.error(`No member named ${name}`);
                alert(
                    "There was no member with that name found. Try refreshing?"
                );
                return;
            }
            let member = members[0];
            let r = manualRegister(
                { memberId: member.id },
                true, // leaveTables
                this.input.element
            );
            r.then((success) => {
                if (!success) {
                    alert("Please try again.");
                    window.location.reload;
                }
            });
        };
    }
    updateMembers() {
        this.datalist.element.innerHTML = "";
        let sortedMembers = [...window.MJDATA.members].sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            } else if (a.name < b.name) {
                return -1;
            } else {
                return 0;
            }
        });
        let member: Member;
        for (member of sortedMembers) {
            this.renderOption(member);
        }
    }
    renderOption(member: Member) {
        let option = new Component({
            tag: "option",
            parent: this.datalist.element,
            textContent: member.name,
        });
    }
}

/** This divison of the sidebar contains a form for registering players, and
 * utilities for:
 * - creating members
 * - deleting members
 * - exporting the raw game data
 * - refreshing the session
 *
 * This may appear as a flex-row with two buttons on either side.
 */
export default class EditMembersPanel extends Component<"div"> {
    register: Register;
    addButton: Component<"button">;
    exportButton: Component<"a">;
    removeButton: RemoveMemberButton;
    resetButton: IconButton;
    constructor(params: Params<"div">) {
        super({
            tag: "div",
            classList: ["edit-members-bar"],
            ...params,
        });
        this.addButton = new AddMemberButton({
            parent: this.element,
            dialogParent: this.element,
        });
        this.removeButton = new RemoveMemberButton({
            dropdownTag: "div",
            options: [],
            parent: this.element,
        });
        this.register = new Register({ parent: this.element });
        this.resetButton = new IconButton({
            // passed as an activator to confirmation (below)
            icon: "reset",
            parent: this.element,
            other: {
                title: "Reset the session (prompted to confirm)",
            },
        });
        let confirmation = new ConfirmationDialog({
            activator: this.resetButton,
            parent: this.element, // NOT INSIDE THE BUTTON otherwise it will reactivate itself
            message:
                "Are you sure you want to reset the session?\n\nThis will sum the current points to each member's total points. This cannot be undone. It will also mark everyone as absent.",
            onconfirm: (ev) => {
                resetSession();
                setTimeout(() => location.reload(), 50);
            },
        });
        this.exportButton = new Component({
            tag: "a",
            parent: this.element,
            other: {
                id: "export-button",
                href: "/data.json",
                download: "mahjong_data.json",
            },
        });
        this.exportButton.element.appendChild(
            new IconButton({
                icon: "save",
                other: {
                    title: "Download raw game data as JSON",
                },
            }).svg
        );
    }
}
