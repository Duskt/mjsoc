"use strict";
(() => {
  // src/pages/qr.ts
  function displayQR(e) {
    e.preventDefault();
    let nameInput = document.getElementById("nameInput");
    window.location.href = "/qr?name=" + encodeURIComponent(nameInput.value);
  }

  // src/components/index.ts
  var Component = class {
    constructor({ debug = false, ...params }) {
      let tag = params.tag;
      this.debug = debug;
      this.element = params.element ? params.element : document.createElement(tag);
      this.element._ParentComponent = this;
      let parent = params.parent;
      if (parent) parent.appendChild(this.element);
      let style = params.style || {};
      for (const styleTag in style) {
        let styleItem = style[styleTag];
        if (styleItem == null) {
          continue;
        }
        this.element.style[styleTag] = styleItem;
      }
      if (params.textContent) this.element.textContent = params.textContent;
      if (params.value)
        this.element.value = params.value;
      let classList = params.classList || [];
      for (const c of classList) {
        this.element.classList.add(c);
      }
      for (const i in params.other) {
        this.element[i] = params.other[i];
      }
    }
    log(...args) {
      if (this.debug) console.log(this, "debug message:\n", ...args);
    }
  };

  // src/request.ts
  async function request(path2, payload, method = "POST") {
    let url = "http://localhost:5654/" + (path2[0] != "/" ? path2 : path2.slice(1));
    let r = await fetch(url, {
      method,
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      }
    });
    return r;
  }

  // src/components/deleteButton.ts
  var DeleteButton = class extends Component {
    constructor(params) {
      let onclick = params.other?.onclick || (async (ev) => {
        let r = await request("/tables", { "table_no": params.tableNo }, "DELETE");
        if (!r.redirected) {
          if (ev.target instanceof HTMLElement) ev.target.parentElement?.parentElement?.parentElement?.remove();
        }
      });
      let classList = params.classList || ["small-button", "delete-button"];
      let textContent = params.textContent || "X";
      super({
        ...params,
        tag: "button",
        classList,
        textContent,
        other: {
          ...params.other,
          onclick
        }
      });
    }
  };

  // src/components/input/listener.ts
  var Listener = class extends Component {
    constructor({ initListener = true, ...params }) {
      super(params);
      this.event = params.event;
      if (initListener) {
        this.listener = this.generateListener();
      }
    }
    get listener() {
      return this.lastListener;
    }
    set listener(v) {
      if (this.listener) {
        this.element.removeEventListener(this.event, this.listener);
      }
      if (!v) return;
      this.element.addEventListener(this.event, v);
      this.lastListener = v;
    }
  };
  var ClickListener = class extends Listener {
    constructor(params) {
      super({
        ...params,
        event: "click"
      });
    }
  };
  var InputListener = class extends Listener {
    constructor(params) {
      super({
        ...params,
        event: "input"
      });
    }
  };

  // src/components/input/focus/focusNode.ts
  var FocusNode = class extends ClickListener {
    constructor(params) {
      super({
        ...params,
        // FocusNode listeners require manual activation
        initListener: false
      });
      // todo: add more DocumentEventMaps
      this.deactivation = "click";
      this.exclude = params.exclude || [];
      this.excludeSelf = params.excludeSelf || true;
      this.excludeChildren = params.excludeChildren || true;
      this.active = false;
      return this;
    }
    generateListener() {
      return (evt) => {
        let target = evt.target;
        if (!(target instanceof HTMLElement)) return;
        if (this.excludeSelf && target.isSameNode(this.element)) return;
        let parent = target.parentElement;
        while (this.excludeChildren && parent) {
          if (parent.isSameNode(this.element)) return;
          parent = parent.parentElement;
        }
        if (this.exclude.includes(target)) return;
        this.deactivate();
      };
    }
    // javascript quirks: overriding one property accessor prevents inheritance of both!
    get listener() {
      return super.listener;
    }
    set listener(v) {
      if (this.listener) {
        document.removeEventListener(this.event, this.listener);
      }
      if (!v) return;
      document.addEventListener(this.event, v);
      this.lastListener = v;
    }
    activate() {
      this.listener = this.generateListener();
      this.active = true;
      return this;
    }
    deactivate() {
      this.listener = void 0;
      this.active = false;
      return this;
    }
  };
  var FocusButton = class extends FocusNode {
    constructor(params = {}) {
      super({
        tag: "button",
        ...params
      });
      this.deactivation = "click";
      this.element.onclick = (ev) => {
        if (this.excludeChildren && ev.target != this.element) {
          return;
        }
        if (this.active) {
          this.deactivate();
        } else {
          this.activate();
        }
      };
    }
  };

  // src/components/input/focus/dropdown.ts
  var Dropdown = class {
    constructor(options) {
      this.element = new Component({
        tag: "div",
        classList: ["dropdown"]
      }).element;
      this.options = options;
    }
    get options() {
      return Array.from(this.element.children);
    }
    set options(value) {
      this.options.forEach((c) => c.remove());
      value.forEach((v) => this.element.appendChild(v));
    }
  };
  var DropdownButton = class extends FocusButton {
    constructor(params) {
      let classList = params.classList || ["small-button", "dropdown-button"];
      let options = params.options || [];
      super({ ...params, classList });
      this.dropdown = new Dropdown(options);
    }
    activate() {
      this.element.appendChild(this.dropdown.element);
      return super.activate();
    }
    deactivate() {
      if (!this.element.contains(this.dropdown.element))
        throw new DOMException(
          "DropdownButton attempted deactivation when inactive."
        );
      this.element.removeChild(this.dropdown.element);
      return super.deactivate();
    }
  };

  // src/components/nametag.ts
  var NameTag = class extends Component {
    constructor({ ...params }) {
      super({
        tag: "select",
        ...params,
        value: void 0
      });
      this.nameOptions = {};
      if (params.value) {
        this.renderOption(params.value);
      } else {
        this.renderPlaceholder();
      }
      for (const m of window.MJDATA.members) {
        if (m.id === params.value?.id) continue;
        this.renderOption(m);
      }
    }
    renderOption(member) {
      let optElem = document.createElement("option");
      optElem.textContent = member.name;
      this.nameOptions[member.id] = optElem;
      this.element.appendChild(optElem);
      return optElem;
    }
    renderPlaceholder() {
      let optElem = document.createElement("option");
      optElem.textContent = "EMPTY";
      this.element.appendChild(optElem);
      return optElem;
    }
  };

  // src/data.ts
  function UsesTable(target) {
    class UsesTable2 extends target {
      get table() {
        let table = window.MJDATA.tables.find(
          (table2) => table2.table_no === this.tableNo
        );
        if (!table)
          throw Error(
            `Failure to index table from tableNo ${this.tableNo}`
          );
        return table;
      }
    }
    return UsesTable2;
  }
  function UsesMember(target) {
    class UsesMember2 extends target {
      get member() {
        let member = window.MJDATA.members.find(
          (member2) => member2.id === this.memberId
        );
        if (!member)
          throw Error(
            `Failure to index member from memberId ${this.memberId}`
          );
        return member;
      }
    }
    return UsesMember2;
  }
  function UsesSeat(target) {
    class UsesSeat2 extends target {
    }
    return UsesSeat2;
  }

  // src/components/player.ts
  var WinButton = class extends UsesMember(UsesTable(FocusButton)) {
    constructor(params) {
      super(params);
      this.tableNo = params.tableNo;
      this.memberId = params.memberId;
      this.zimo = new FaanDropdownButton({
        textContent: "\u81EA\u6478"
      });
      this.dachut = new DropdownButton({
        textContent: "\u6253\u51FA"
      });
      this.updatePlayers();
    }
    activate() {
      this.element.style["width"] = "100px";
      this.element.appendChild(this.zimo.element);
      this.element.appendChild(this.dachut.element);
      return super.activate();
    }
    deactivate() {
      this.element.style["width"] = "";
      for (const c of Array.from(this.element.children)) {
        this.element.removeChild(c);
      }
      return super.deactivate();
    }
    updatePlayers() {
      let table = this.table;
      let member = this.member;
      let otherPlayers = ["east", "south", "west", "north"].filter((seat) => table[seat] != member.id).map(
        (seat) => window.MJDATA.members.find((m) => m.id == table[seat])
      );
      this.dachut.dropdown.options = otherPlayers.map(
        (m) => new FaanDropdownButton({
          textContent: m?.name || "",
          classList: ["small-button"],
          onclick: (ev, faan) => alert(
            `${this.member.name} took ${faan} from ${m?.name}.`
          )
        }).element
      );
      this.zimo.onclick = (ev, faan) => {
        let otherNames = otherPlayers.map((v) => v?.name || "EMPTY");
        alert(`${this.member.name} took ${faan} faan from ${otherNames}`);
      };
    }
    updateMember(memberId) {
      this.memberId = memberId;
      this.updatePlayers();
    }
    updateTable(tableNo) {
      throw Error("not written");
      this.tableNo = tableNo;
    }
    static empty(parent) {
      return new Component({
        tag: "button",
        textContent: "\u98DF",
        parent,
        classList: ["win-button", "small-button"],
        other: {
          disabled: true
        }
      });
    }
  };
  var FaanDropdownButton = class extends DropdownButton {
    constructor(params) {
      let min = params.min || 3;
      let max = params.max || 13;
      let faanRange = Array.from(Array(max + 1).keys()).slice(min);
      let passedOnclick = params.onclick;
      if (!passedOnclick) passedOnclick = () => {
      };
      let onclick;
      let options = faanRange.map((faan) => {
        onclick = (ev) => passedOnclick(ev, faan);
        return new Component({
          tag: "button",
          classList: ["small-button"],
          textContent: faan.toString(),
          other: {
            onclick
          }
        }).element;
      });
      super({ ...params, options });
      this.min = min;
      this.max = max;
      this._onclick = passedOnclick;
    }
    get onclick() {
      return this._onclick;
    }
    set onclick(v) {
      let faanRange = Array.from(Array(this.max + 1).keys()).slice(this.min);
      this.dropdown.options = faanRange.map((faan) => {
        let func = (ev) => v(ev, faan);
        return new Component({
          tag: "button",
          classList: ["small-button"],
          textContent: faan.toString(),
          other: {
            onclick: func
          }
        }).element;
      });
      this._onclick = v;
    }
  };
  var PlayerTag = class extends UsesTable(
    UsesSeat(InputListener)
  ) {
    constructor(params) {
      super({
        ...params,
        classList: ["player"],
        tag: "td"
      });
      this.tableNo = params.tableNo;
      let table = this.table;
      this.seat = params.seat;
      this.nameTag = new NameTag({
        classList: ["name-tag", this.seat],
        parent: this.element,
        value: window.MJDATA.members.find((v) => v.id === table[this.seat])
      });
      this.memberId = table[this.seat];
      if (this.memberId === 0) {
        this.winButton = WinButton.empty(this.element);
      } else {
        this.winButton = new WinButton({
          tableNo: this.tableNo,
          memberId: this.memberId,
          textContent: "\u98DF",
          parent: this.element,
          classList: ["win-button", "small-button"]
        });
      }
    }
    updateSeat(seat) {
      throw Error("not written");
      this.seat = seat;
      this.listener = this.generateListener();
    }
    updateTable(tableNo) {
      throw Error("not written");
      this.tableNo = tableNo;
      this.listener = this.generateListener();
    }
    // called by the parent table when it receives the input event
    updateWinButton() {
      let newMemberId = this.table[this.seat];
      console.debug(
        "player.ts PlayerTag updateWinButton()",
        this,
        newMemberId
      );
      if (newMemberId === 0) {
        this.winButton.element.remove();
        this.winButton = WinButton.empty(this.element);
      } else {
        let newMember = window.MJDATA.members.find(
          (v) => v.id === newMemberId
        );
        if (!newMember)
          throw Error(`New member with id ${newMemberId} not found.`);
        if (this.winButton instanceof WinButton) {
          this.winButton.updateMember(newMember.id);
        } else if (this.memberId != 0) {
          this.winButton.element.remove();
          this.winButton = new WinButton({
            tableNo: this.tableNo,
            memberId: this.memberId,
            textContent: "\u98DF",
            parent: this.element,
            classList: ["win-button", "small-button"]
          });
        }
      }
    }
    // PlayerTag should update the table data but all the WinButtons will be updated by the table
    generateListener() {
      return async (ev) => {
        this.log("PlayerTag select listener!");
        let target = ev.target;
        if (!(target instanceof HTMLSelectElement)) return;
        let newMember = window.MJDATA.members.find(
          (v) => v.name === target.value
        );
        if (!newMember) throw Error("could not find member from <option>");
        this.memberId = newMember.id;
        let tableCopy = this.table;
        tableCopy[this.seat] = newMember.id;
        await request(
          "/tables",
          {
            table_no: this.tableNo,
            table: this.table
          },
          "PUT"
        );
        window.MJDATA.tables[this.tableNo] = tableCopy;
      };
    }
  };

  // src/components/input/focus/dialog.ts
  var Dialog = class extends FocusNode {
    constructor({ activator, ...params }) {
      super(params);
      this.excludeSelf = false;
      this.activator = activator;
      let dialog = this;
      if (!this.activator.onclick) {
        this.activator.onclick = (ev) => {
          dialog.activate();
        };
      }
      this.exclude.push(this.activator);
      this.element.style["padding"] = "0";
    }
    activate() {
      this.element.showModal();
      return super.activate();
    }
    deactivate() {
      this.element.close();
      return super.deactivate();
    }
  };

  // src/components/sidebar.ts
  function renderSidebar() {
    let sidebar = document.getElementsByClassName("sidebar")[0];
    if (!(sidebar instanceof HTMLElement)) {
      throw Error("Could not find sidebar");
    }
    let sidebarButton = Array.from(sidebar.children).find(
      (v) => v.tagName == "BUTTON"
    );
    if (!(sidebarButton instanceof HTMLButtonElement)) {
      throw Error("Could not find sidebarButton");
    }
    let sidebarDiv = Array.from(sidebar.children).find(
      (v) => v.tagName == "DIV"
    );
    if (!(sidebarDiv instanceof HTMLElement)) {
      throw Error("Could not find sidebarDiv");
    }
    let closeSidebar = () => {
      sidebar.classList.replace("open", "closed");
      sidebarButton.textContent = ">";
    };
    let openSidebar = () => {
      sidebar.classList.replace("closed", "open");
      sidebarButton.textContent = "<";
    };
    sidebar.style["transition"] = "none";
    sidebar.classList.add("closed");
    setTimeout(() => sidebar.style["transition"] = "", 1);
    sidebarButton.onclick = () => {
      if (sidebarButton.textContent == ">") openSidebar();
      else closeSidebar();
    };
    let addMemberButton = document.getElementById("add-member");
    if (!(addMemberButton instanceof HTMLButtonElement)) {
      throw Error("no #add-member button");
    }
    let form = document.getElementById("name")?.parentElement;
    if (!(form instanceof HTMLFormElement)) {
      throw Error("no form");
    }
    let dialog = new Dialog({
      tag: "dialog",
      element: document.getElementsByTagName("dialog")[0],
      activator: addMemberButton
    });
    let memberList = new MemberList({
      tag: "ul",
      parent: sidebarDiv
    });
    form.onsubmit = (ev) => {
      ev.preventDefault();
      let name = new FormData(form).get("name");
      if (!name) {
        throw Error("no name");
      }
      request("/members", { name }, "POST").then((v) => {
        if (v.ok)
          v.json().then((v2) => {
            window.MJDATA.members.push(v2);
            memberList.renderLi(v2);
          });
      });
      dialog.deactivate();
    };
  }
  var MemberList = class extends Component {
    constructor(params) {
      super(params);
      this.memberElems = {};
      window.MJDATA.members.forEach((m) => this.renderLi(m));
    }
    renderLi(member) {
      let melem = document.createElement("li");
      melem.textContent = `${member.name}: ${member.points}`;
      this.memberElems[member.id] = melem;
      this.element.appendChild(melem);
      return melem;
    }
  };

  // src/pages/tables.ts
  function tables() {
    let table_table = document.getElementById("table");
    if (!table_table) throw Error("No element with the table id is present.");
    let current_row = document.createElement("tr");
    let n_cols = Math.ceil(Math.sqrt(window.MJDATA.tables.length));
    let index = 0;
    let td = document.createElement("td");
    for (const i of window.MJDATA.tables) {
      index++;
      if (index > n_cols) {
        table_table.appendChild(current_row);
        current_row = document.createElement("tr");
        index = 0;
      }
      let gameTable = new GameTable({
        parent: td,
        table: i
      });
      current_row.appendChild(td);
      td = document.createElement("td");
    }
    table_table.appendChild(current_row);
    renderSidebar();
  }
  var GameTable = class extends UsesTable(InputListener) {
    constructor(params) {
      super({
        ...params,
        tag: "table",
        debug: true
      });
      this.tableNo = params.table.table_no;
      let blank = (v) => v.appendChild(document.createElement("td"));
      let innerRows = [
        document.createElement("tr"),
        document.createElement("tr"),
        document.createElement("tr")
      ];
      innerRows.forEach((i) => this.element.appendChild(i));
      blank(innerRows[0]);
      let west = new PlayerTag({
        parent: innerRows[0],
        tableNo: params.table.table_no,
        seat: "west"
      });
      blank(innerRows[0]);
      let north = new PlayerTag({
        parent: innerRows[1],
        tableNo: params.table.table_no,
        seat: "north"
      });
      this.renderTableDisplay(innerRows[1]);
      let south = new PlayerTag({
        parent: innerRows[1],
        tableNo: params.table.table_no,
        seat: "south"
      });
      blank(innerRows[2]);
      let east = new PlayerTag({
        parent: innerRows[2],
        tableNo: params.table.table_no,
        seat: "east"
      });
      this.renderDeleteCell(innerRows[2]);
      this.players = [east, south, west, north];
    }
    renderDeleteCell(parent) {
      let deleteButtonCell = document.createElement("td");
      let deleteButton = new DeleteButton({
        parent: deleteButtonCell,
        tableNo: this.tableNo
      });
      parent.appendChild(deleteButtonCell);
    }
    renderTableDisplay(parent) {
      let inner_table_display = document.createElement("td");
      inner_table_display.classList.add("mahjong-table-display");
      inner_table_display.textContent = this.tableNo.toString();
      parent.appendChild(inner_table_display);
    }
    generateListener() {
      return (ev) => {
        for (const player of this.players) {
          player.updateWinButton();
        }
      };
    }
    updateTable(tableNo) {
      throw Error("not imp.");
    }
  };

  // src/index.ts
  function path() {
    return window.location.href.split("/").slice(3).join("/");
  }
  if (["tables", "table"].some((x) => x === path())) {
    document.addEventListener("DOMContentLoaded", tables);
  }
  if (path() === "qr") {
    displayQR;
  }
})();
