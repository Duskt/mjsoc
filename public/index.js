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
    constructor(params) {
      let tag = params.tag;
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
  };

  // src/request.ts
  var pointTransfer = new Event("mjPointTransfer");
  async function request(path2, payload, method = "POST") {
    let url = "http://localhost:5654/" + (path2[0] != "/" ? path2 : path2.slice(1));
    let r = await fetch(url, {
      method,
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      }
    });
    if (path2 === "/members/transfer") {
      let updated_members = await r.json();
      let new_member;
      console.log(window.MJDATA.members, updated_members);
      window.MJDATA.members = window.MJDATA.members.map((old_member) => {
        new_member = updated_members.find(
          (new_member2) => new_member2.id === old_member.id
        );
        if (new_member !== void 0) {
          return new_member;
        } else {
          return old_member;
        }
      });
      document.dispatchEvent(pointTransfer);
    }
    return r;
  }

  // src/components/deleteButton.ts
  var DeleteButton = class extends Component {
    constructor(params) {
      let onclick = params.other?.onclick || (async (ev) => {
        let r = await request("/tables", { "table_no": params.tableNo }, "DELETE");
        if (!r.redirected) {
          window.MJDATA.tables = window.MJDATA.tables.filter((v) => v.table_no !== params.tableNo);
          if (params.ondelete) {
            params.ondelete();
          }
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
    /**
     * 
     * @param {object} params Parameter object:
     * @param {HTMLElement[]} params.options Dropdown children (buttons recommended)
     */
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
  var NameTag = class extends InputListener {
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
      this.empty = optElem;
      this.element.appendChild(optElem);
      return optElem;
    }
    generateListener() {
      return () => {
        this.empty?.remove();
        this.listener = void 0;
      };
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
  function getTablemates(myId, table) {
    let result = [];
    for (let mid of [table.east, table.south, table.west, table.north]) {
      if (mid !== myId) {
        result.push(mid);
      }
    }
    return result;
  }
  var TEMP_TABLE = /* @__PURE__ */ new Map();
  TEMP_TABLE.set(3, 8);
  TEMP_TABLE.set(4, 16);
  TEMP_TABLE.set(5, 24);
  TEMP_TABLE.set(6, 32);
  TEMP_TABLE.set(7, 48);
  TEMP_TABLE.set(8, 64);
  TEMP_TABLE.set(9, 96);
  TEMP_TABLE.set(10, 128);
  TEMP_TABLE.set(11, 192);
  TEMP_TABLE.set(12, 256);
  TEMP_TABLE.set(13, 384);
  function getPointsFromFaan(faan) {
    return TEMP_TABLE.get(faan);
  }
  var WinButton = class extends UsesMember(UsesTable(FocusButton)) {
    constructor(params) {
      super(params);
      this.popup = new Component({
        tag: "div",
        classList: ["win-button-popup"]
      });
      this.tableNo = params.tableNo;
      this.memberId = params.memberId;
      this.zimo = new FaanDropdownButton({
        textContent: "\u81EA\u6478",
        parent: this.popup.element
        // don't set onclick here - do it in updatePlayers
      });
      this.dachut = new DropdownButton({
        textContent: "\u6253\u51FA",
        parent: this.popup.element
        // don't set onclick here - do it in updatePlayers
      });
      this.baozimo = new DropdownButton({
        textContent: "\u5305\u81EA\u6478",
        parent: this.popup.element
      });
      this.updatePlayers();
    }
    activate() {
      this.element.appendChild(this.popup.element);
      return super.activate();
    }
    deactivate() {
      this.element.removeChild(this.popup.element);
      return super.deactivate();
    }
    updatePlayers() {
      let table = this.table;
      let member = this.member;
      let otherSeats = ["east", "south", "west", "north"].filter((seat) => table[seat] != member.id);
      let otherPlayers = otherSeats.map(
        (seat) => window.MJDATA.members.find((m) => m.id == table[seat])
      );
      this.dachut.dropdown.options = otherPlayers.map(
        (m) => new FaanDropdownButton({
          textContent: m?.name || "",
          classList: ["small-button"],
          onclick: async (ev, faan) => await request(
            "/members/transfer",
            {
              to: this.memberId,
              from: [m?.id],
              points: getPointsFromFaan(faan) * 2
            },
            "POST"
          )
        }).element
      );
      this.baozimo.dropdown.options = otherPlayers.map(
        (m) => new FaanDropdownButton({
          textContent: m?.name || "",
          classList: ["small-button"],
          onclick: async (ev, faan) => await request(
            "/members/transfer",
            {
              to: this.memberId,
              from: [m?.id],
              points: getPointsFromFaan(faan) * 3
            },
            "POST"
          )
        }).element
      );
      this.zimo.onclick = async (ev, faan) => {
        let otherNames = otherPlayers.map((v) => v?.name || "EMPTY");
        await request(
          "/members/transfer",
          {
            to: this.memberId,
            from: getTablemates(this.memberId, this.table),
            points: getPointsFromFaan(faan)
          },
          "POST"
        );
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
      } else if (window.MJDATA.members.find((m) => m.id == this.memberId) === void 0) {
        console.warn(
          `Found a table ${table.table_no} with an invalid member of id ${table[this.seat]}. Assuming EMPTY - the datafile might need to be manually cleaned.`
        );
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

  // src/components/seatingUtils.ts
  function isSat(mem) {
    for (let t of window.MJDATA.tables) {
      if (mem.id == t.east) return true;
      if (mem.id == t.south) return true;
      if (mem.id == t.west) return true;
      if (mem.id == t.north) return true;
    }
    return false;
  }
  async function seatMemberLast(mem) {
    for (let t of window.MJDATA.tables.sort(
      (a, b) => a.table_no - b.table_no
    )) {
      if (t.east === 0) {
        t.east = mem.id;
      } else if (t.south === 0) {
        t.south = mem.id;
      } else if (t.west === 0) {
        t.west = mem.id;
      } else if (t.north === 0) {
        t.north = mem.id;
      } else {
        continue;
      }
      return await request(
        "/tables",
        {
          table_no: t.table_no,
          table: t
        },
        "PUT"
      );
    }
  }
  async function allocateSeats() {
    for (let mem of window.MJDATA.members) {
      if (!isSat(mem)) {
        if (await seatMemberLast(mem) === void 0) {
          return false;
        }
      }
    }
    return true;
  }
  function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  async function shuffleSeats() {
    let flatTables = [];
    let tableOrders = [];
    for (let t of window.MJDATA.tables) {
      tableOrders.push(t.table_no);
      flatTables.push(t.east);
      flatTables.push(t.south);
      flatTables.push(t.west);
      flatTables.push(t.north);
    }
    shuffleArray(flatTables);
    let index = 0;
    let tablen;
    let seatn;
    let table;
    while (index < flatTables.length) {
      tablen = tableOrders[Math.floor(index / 4)];
      seatn = index % 4;
      table = window.MJDATA.tables.find((v) => v.table_no == tablen);
      if (table === void 0) throw Error("how was table undefined!!!");
      if (seatn === 0) {
        table.east = flatTables[index];
      } else if (seatn === 1) {
        table.south = flatTables[index];
      } else if (seatn === 2) {
        table.west = flatTables[index];
      } else if (seatn === 3) {
        table.north = flatTables[index];
        await request(
          "/tables",
          {
            table_no: tablen,
            table
          },
          "PUT"
        );
      }
      index++;
    }
  }

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
  async function removeMember(mem) {
    let r = await request("/members", { name: mem.name }, "DELETE");
    if (r.ok) {
      let index = window.MJDATA.members.indexOf(mem);
      window.MJDATA.members.splice(index, 1);
      for (let t of window.MJDATA.tables) {
        if (t.east === mem.id) t.east = 0;
        if (t.south === mem.id) t.south = 0;
        if (t.west === mem.id) t.west = 0;
        if (t.north === mem.id) t.north = 0;
      }
      return true;
    }
    return false;
  }
  function renderSidebar(onMemberChange = () => {
  }) {
    let sidebar = document.getElementById("sidebar");
    let main_article = document.getElementById("tables");
    if (!(sidebar instanceof HTMLElement)) {
      throw Error("Could not find sidebar");
    }
    if (!(main_article instanceof HTMLElement)) {
      throw Error("Could not find main tables article");
    }
    let innerSidebar = new Component({
      tag: "div",
      parent: sidebar
    });
    let sidebarButton = new Component({
      tag: "button",
      textContent: ">",
      parent: sidebar
    });
    let closeSidebar = () => {
      main_article.removeAttribute("style");
      sidebar.removeAttribute("style");
      sidebar.classList.replace("open", "closed");
      sidebarButton.element.textContent = ">";
    };
    let openSidebar = () => {
      sidebar.classList.replace("closed", "open");
      if (window.innerWidth < 800) {
        sidebar.style["width"] = "100%";
        main_article.style["display"] = "none";
      } else {
        sidebar.style["width"] = "30%";
      }
      sidebarButton.element.textContent = "<";
    };
    sidebar.style["transition"] = "none";
    sidebar.classList.add("closed");
    setTimeout(() => sidebar.style["transition"] = "", 1);
    sidebarButton.element.onclick = () => {
      if (sidebarButton.element.textContent == ">") openSidebar();
      else closeSidebar();
    };
    let addMemberButton = new Component({
      tag: "button",
      classList: ["member-button"],
      parent: innerSidebar.element,
      textContent: "Add a new member",
      other: {
        id: "add-member"
      }
    });
    let form = document.getElementById("name")?.parentElement;
    if (!(form instanceof HTMLFormElement)) {
      throw Error("no form");
    }
    let dialog = new Dialog({
      tag: "dialog",
      element: document.getElementsByTagName("dialog")[0],
      activator: addMemberButton.element
    });
    let memberList = new MemberGrid({
      tag: "table",
      classList: ["member-grid"]
    });
    addMemberButton.element.insertAdjacentElement(
      "afterend",
      memberList.element
    );
    let removeMemberButton = new DropdownButton({
      textContent: "Remove a member",
      classList: ["member-button"],
      parent: innerSidebar.element,
      options: []
    });
    let updateRemoveMemberButton = () => removeMemberButton.dropdown.options = window.MJDATA.members.map(
      (m) => new Component({
        tag: "button",
        textContent: m.name,
        other: {
          onclick: async (ev) => {
            if (await removeMember(m)) {
              memberList.updateMembers();
              onMemberChange();
            }
          }
        }
      }).element
    );
    updateRemoveMemberButton();
    let overrideContainer = new OverrideContainer({
      parent: innerSidebar.element
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
            onMemberChange();
            updateRemoveMemberButton();
          });
      });
      dialog.deactivate();
    };
  }
  var MemberList = class extends Component {
    constructor(params) {
      super(params);
      this.memberElems = {};
      this.updateMembers();
      document.addEventListener("mjPointTransfer", () => {
        this.updateMembers();
      });
    }
    updateMembers() {
      this.memberElems = {};
      while (this.element.lastChild) {
        this.element.removeChild(this.element.lastChild);
      }
      [...window.MJDATA.members].sort((a, b) => b.points - a.points).forEach((m) => this.renderLi(m));
    }
  };
  var MemberGrid = class extends MemberList {
    renderLi(member) {
      let row = new Component({
        tag: "tr",
        parent: this.element
      });
      let name = new Component({
        tag: "td",
        textContent: member.name,
        parent: row.element
      });
      let highlight = member.points > 0 ? "green" : member.points === 0 ? "yellow" : "red";
      let points = new Component({
        tag: "td",
        textContent: member.points.toString(),
        parent: row.element
      });
      points.element.style["backgroundColor"] = highlight;
    }
  };
  var ToggleComponent = class extends Component {
    constructor(params) {
      super(params);
      this.hidden = false;
      this.mode = params.mode;
      this.children = document.createDocumentFragment().children;
    }
    show() {
      this.hidden = false;
      for (let item of Array.from(this.children)) {
        this.element.appendChild(item);
      }
      this.element.style["display"] = this.mode;
    }
    hide() {
      this.hidden = true;
      this.children = this.element.children;
      while (this.element.lastChild) {
        this.element.removeChild(this.element.lastChild);
      }
      this.element.style["display"] = "none";
    }
    toggle() {
      if (this.hidden) {
        this.show();
      } else {
        this.hide();
      }
    }
  };
  var OverrideContainer = class extends Component {
    constructor(params) {
      super({
        tag: "div",
        classList: ["override-panel"],
        ...params
      });
      this.toggleButton = new Component({
        tag: "button",
        textContent: "Advanced override panel",
        parent: this.element,
        classList: ["override-toggle"]
      });
      this.overridePanel = new ToggleComponent({
        tag: "div",
        mode: "block",
        parent: this.element
      });
      this.editContent = new Component({
        tag: "textarea",
        parent: this.overridePanel.element
      });
      this.submitButton = new Component({
        tag: "button",
        parent: this.overridePanel.element
      });
      this.overridePanel.hide();
      this.toggleButton.element.onclick = () => this.overridePanel.toggle;
    }
  };

  // src/pages/tables.ts
  function tables() {
    renderTables();
    renderSidebar(() => {
      renderTables();
    });
    renderHeader();
  }
  function renderHeader() {
    let headerBar = document.getElementById("header-bar");
    if (headerBar == void 0) {
      throw Error("No element with header-bar id");
    }
    let sit = new Component({
      tag: "button",
      textContent: "S",
      other: {
        onclick: async (ev) => {
          await allocateSeats();
          renderTables();
        }
      }
    });
    headerBar.children[0].insertAdjacentElement("beforebegin", sit.element);
    let shuffle = new Component({
      tag: "button",
      textContent: "R",
      parent: headerBar,
      other: {
        onclick: async (ev) => {
          await shuffleSeats();
          renderTables();
        }
      }
    });
  }
  function renderTables() {
    let table_table = document.getElementById("table");
    if (!table_table) throw Error("No element with the table id is present.");
    table_table.innerHTML = "";
    let tables2 = [];
    let sorted_tabledata = [...window.MJDATA.tables].sort(
      (a, b) => a.table_no - b.table_no
    );
    tables2 = tables2.concat(sorted_tabledata).concat([void 0]);
    let current_row = document.createElement("tr");
    let n_cols = Math.ceil(Math.sqrt(tables2.length));
    let index = 0;
    let td = document.createElement("td");
    for (const i of tables2) {
      if (index >= n_cols) {
        table_table.appendChild(current_row);
        current_row = document.createElement("tr");
        index = 0;
      }
      if (i === void 0) {
        let createTableButton = new Component({
          tag: "button",
          textContent: "+",
          parent: td,
          classList: ["create-table"],
          other: {
            onclick: async (ev) => {
              let r = await request("/tables", {}, "POST");
              window.MJDATA.tables.push(await r.json());
              renderTables();
            }
          }
        });
      } else {
        let gameTable = new GameTable({
          parent: td,
          table: i
        });
      }
      current_row.appendChild(td);
      td = document.createElement("td");
      index++;
    }
    table_table.appendChild(current_row);
  }
  var GameTable = class extends UsesTable(InputListener) {
    constructor(params) {
      super({
        ...params,
        tag: "table"
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
        tableNo: this.tableNo,
        ondelete: () => {
          renderTables();
        }
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
