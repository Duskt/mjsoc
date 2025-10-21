import Component, { Params } from '.';
import { addMember, editMember, manualRegister, resetSession } from '../request';
import IconButton from './icons';
import Dialog, { ConfirmationDialog } from './input/focus/dialog';
import { DropdownButton, DropdownButtonParameters } from './input/focus/dropdown';
import { LabelledInput, SmartInput } from './input/form/input';

class RemoveMemberButton extends DropdownButton<'div', 'button'> {
    icon: Component<'span'>;
    constructor(params: DropdownButtonParameters<'div', 'button'>) {
        super({
            classList: ['icon-button'],
            ...params,
        });
        this.icon = new Component({
            tag: 'span',
            parent: this.element,
            textContent: '-',
            style: { marginTop: '-1px', pointerEvents: 'none' },
        });
        this.update();
    }
    update() {
        this.dropdown.options = window.MJDATA.members.map(
            (m) =>
                new Component({
                    tag: 'button',
                    textContent: m.name,
                    other: {
                        onclick: async (ev: MouseEvent) => editMember({ id: m.id }, this.element),
                    },
                }).element,
        );
    }
}

interface AddMemberButtonParams extends Params<'button'> {
    dialogParent: HTMLElement;
}

class AddMemberButton extends Component<'button'> {
    icon: Component<'span'>;
    dialog: Dialog;
    form: Component<'form'>;
    label: Component<'label'>;
    input: Component<'input'>;
    submit: Component<'button'>;
    constructor(params: AddMemberButtonParams) {
        super({
            tag: 'button',
            classList: ['icon-button'],
            other: {
                id: 'add-member',
            },
            ...params,
        });
        this.icon = new Component({
            tag: 'span',
            textContent: '+',
            style: { marginTop: '-1px', pointerEvents: 'none' },
            parent: this.element,
        });
        this.dialog = new Dialog({
            activator: this,
            parent: document.body,
            id: 'add-member-dialog',
        });
        this.form = new Component({
            tag: 'form',
            parent: this.dialog.element,
            id: 'new-member-form',
            other: {
                method: 'dialog',
                action: '/members',
                enctype: 'application/json',
                onsubmit: async (ev) => {
                    ev.preventDefault();
                    let name = new FormData(this.form.element).get('name')?.toString();
                    if (!name) {
                        throw Error('no name');
                    }
                    await addMember({ name }, this.form.element);
                },
            },
        });
        this.form.element.addEventListener('mjAddMember', () => this.dialog.deactivate());
        this.label = new Component({
            tag: 'label',
            textContent: 'New member',
            parent: this.form.element,
            other: {
                htmlFor: 'name',
            },
        });
        this.input = new Component({
            tag: 'input',
            parent: this.form.element,
            id: 'name',
            other: {
                name: 'name',
                autocomplete: 'name',
                placeholder: 'Username',
            },
        });
        this.submit = new Component({
            tag: 'button',
            textContent: 'Submit',
            parent: this.form.element,
        });
    }
}

class Register extends Component<'form'> {
    input: LabelledInput<SmartInput>;
    sortMembers: (...members: Member[]) => Member[] = (...members) =>
        members.sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            } else if (a.name < b.name) {
                return -1;
            } else {
                return 0;
            }
        });
    constructor(params: Params<'form'>) {
        super({
            tag: 'form',
            classList: ['register'],
            ...params,
        });
        this.input = new SmartInput({
            id: 'register-input',
            parent: this.element,
            optionsValues: this.sortMembers(...window.MJDATA.members).map((v) => v.name),
        }).label('Register');
        this.input.element.style['fontSize'] = '14px';
        this.element.onsubmit = (ev) => {
            ev.preventDefault();
            let name = this.input.element.value.trim();
            let members = window.MJDATA.members.filter((m) => m.name.trim() == name);
            if (members.length > 1) {
                console.error(`Multiple members named ${name}`);
                alert(
                    'There seem to be multiple members with this name. If this is unlikely, try refreshing. Otherwise, you should rename one, I guess.',
                );
                return;
            } else if (members.length === 0) {
                console.error(`No member named ${name}`);
                alert('There was no member with that name found. Try refreshing?');
                return;
            }
            let member = members[0];
            let r = manualRegister(
                { memberId: member.id },
                true, // leaveTables
                this.input.element,
            );
            r.then((success) => {
                if (!success) {
                    alert('Please try again.');
                    window.location.reload;
                }
            });
        };
    }
    updateMembers() {
        this.input.renderOptions(this.sortMembers(...window.MJDATA.members).map((m) => m.name));
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
export default class EditMembersPanel extends Component<'div'> {
    register: Register;
    buttonPanel: Component<'div'>;
    addButton: Component<'button'>;
    exportButton: Component<'a'>;
    removeButton: RemoveMemberButton;
    resetButton: IconButton;
    constructor(params: Params<'div'>) {
        super({
            tag: 'div',
            classList: ['edit-members-bar'],
            ...params,
        });
        this.register = new Register({ parent: this.element });
        this.buttonPanel = new Component({
            tag: 'div',
            parent: this.element,
        });
        this.addButton = new AddMemberButton({
            parent: this.buttonPanel.element,
            dialogParent: this.element,
        });
        this.removeButton = new RemoveMemberButton({
            dropdownTag: 'div',
            options: [],
            parent: this.buttonPanel.element,
        });
        this.resetButton = new IconButton({
            // passed as an activator to confirmation (below)
            icon: 'reset',
            parent: this.buttonPanel.element,
            other: {
                title: 'Reset the session (prompted to confirm)',
            },
        });
        this.exportButton = new Component({
            tag: 'a',
            classList: ['icon-button'],
            parent: this.buttonPanel.element,
            other: {
                id: 'export-button',
                href: '/data.json',
                download: 'mahjong_data.json',
            },
        });
        this.exportButton.element.appendChild(
            new IconButton({
                icon: 'download',
                other: {
                    title: 'Download raw game data as JSON',
                },
            }).svg,
        );
        let confirmation = new ConfirmationDialog({
            activator: this.resetButton,
            parent: this.element, // NOT INSIDE THE BUTTON otherwise it will reactivate itself
            message:
                "Are you sure you want to reset the session?\n\nThis will sum the current points to each member's total points. This cannot be undone. It will also mark everyone as absent.",
            onconfirm: async (ev) => {
                let r = await resetSession();
                if (r === undefined) location.reload();
            },
        });
    }
}
