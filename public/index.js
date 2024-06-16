"use strict";
(() => {
  // src/components/index.ts
  var Component = class {
    element;
    constructor(params) {
      let tag = params.tag;
      this.element = document.createElement(tag);
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
  async function request(path2, payload, method = "POST") {
    let url = "http://localhost:5654/" + (path2[0] != "/" ? path2 : path2.slice(1));
    let r = await fetch(url, {
      method,
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      }
    });
    document.createElement("a").children[0];
    if (r.redirected && method != "GET") {
      let oldHref = window.location.href;
      let redirectHref = r.url;
      const observer = new MutationObserver((mutations) => {
        console.log("mutation");
        if (redirectHref != window.location.href) {
          console.log("redirect mutation detected, resending request");
          fetch(url, {
            method,
            body: JSON.stringify(payload),
            headers: {
              "Content-Type": "application/json; charset=UTF-8"
            }
          });
          console.log("disconnecting after going back to ", oldHref);
          observer.disconnect();
          window.location.replace(oldHref);
        }
      });
      window.location.replace(redirectHref);
    }
    return !r.redirected;
  }

  // src/components/deleteButton.ts
  var DeleteButton = class extends Component {
    constructor(params) {
      let onclick = params.other?.onclick || (async (ev) => {
        let r = await request("editTable", { "table_no": params.tableNo }, "DELETE");
        console.log(r);
        if (r) {
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

  // src/components/dropdown.ts
  var FocusNode = class extends Component {
    exclude;
    excludeSelf;
    excludeChildren;
    listener;
    active;
    // todo: add more DocumentEventMaps
    deactivation = "click";
    constructor(params) {
      super(params);
      this.exclude = params.exclude || [];
      this.excludeSelf = params.excludeSelf || true;
      this.excludeChildren = params.excludeChildren || true;
      this.active = false;
      if (this.excludeSelf) this.exclude.push(this.element);
      return this;
    }
    activate() {
      console.log(`Activating ${this.constructor.name}`);
      this.listener = (ev) => {
        if (this.excludeChildren) {
          let childElements = Array.from(this.element.children).filter((v) => v instanceof HTMLElement);
          let newChildren = childElements.filter((v) => !this.exclude.includes(v));
          this.exclude.concat(newChildren);
          this.exclude = this.exclude.filter((v) => v);
        }
        ;
        if (ev.target instanceof HTMLElement && this.exclude.includes(ev.target)) return;
        this.deactivate();
      };
      this.active = true;
      console.log("added ev lis");
      document.addEventListener(this.deactivation, this.listener);
      return this;
    }
    deactivate() {
      console.log(`DEactivating ${this.constructor.name}`);
      this.active = false;
      console.log("remov ev lis");
      if (this.listener) document.removeEventListener(this.deactivation, this.listener);
      return this;
    }
  };
  var FocusButton = class extends FocusNode {
    deactivation = "click";
    constructor(params = {}) {
      super({
        tag: "button",
        ...params
      });
      this.element.onclick = (ev) => {
        console.log(`FocusButton (${this.constructor.name}).onclick`);
        ev.stopPropagation();
        if (this.active) {
          this.deactivate();
        } else {
          this.activate();
        }
      };
    }
  };
  var Dropdown = class {
    element;
    options;
    constructor(options) {
      this.element = new Component({
        tag: "div",
        classList: ["dropdown"]
      }).element;
      this.options = options;
      this.options.forEach((v) => this.element.appendChild(v));
    }
  };
  var DropdownButton = class extends FocusButton {
    dropdown;
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
      this.element.removeChild(this.dropdown.element);
      return super.deactivate();
    }
  };

  // src/components/player.ts
  var WinButton = class extends FocusButton {
    // there are two types of wins:
    zimo;
    // 'self-draw' points are split between the table's other 3 players
    dachut;
    // 'direct hit' points are taken from one player, needing two dropdowns.
    constructor(params) {
      super(params);
      this.zimo = new FaanDropdownButton({
        textContent: "\u81EA\u6478"
      });
      this.dachut = new DropdownButton({
        textContent: "\u6253\u51FA"
      });
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
  };
  var FaanDropdownButton = class extends DropdownButton {
    min;
    max;
    constructor(params) {
      let min = params.min || 3;
      let max = params.max || 13;
      let faanRange = Array.from(Array(max + 1).keys()).slice(min);
      let options = faanRange.map((faan) => new Component({
        tag: "button",
        textContent: faan.toString(),
        other: {
          onclick: (ev) => {
            alert(`Took ${faan} faan!`);
          }
        }
      }).element);
      super({ ...params, options });
      this.min = min;
      this.max = max;
    }
  };
  var PlayerTag = class {
    // the component (a table cell element) 'player'...
    player;
    // contains the nametag (input) and winbutton components
    nameTag;
    winButton;
    constructor(parent, tableNo, seat, name) {
      this.player = new Component({
        tag: "td",
        parent,
        classList: ["player"]
      });
      this.nameTag = new Component({
        tag: "input",
        classList: ["name-tag", seat],
        parent: this.player.element,
        value: name
      });
      this.nameTag.element.addEventListener("input", async (ev) => {
        await request("playerNameEdit", {
          "table_no": tableNo,
          "seat": seat,
          "new_name": this.nameTag.element.value
        });
      });
      this.winButton = new WinButton({
        textContent: "\u98DF",
        parent: this.player.element,
        classList: ["win-button", "small-button"]
      });
    }
  };

  // src/pages/tables.ts
  function onPageRequest() {
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
      td.appendChild(renderPlayerTable(td, i));
      current_row.appendChild(td);
      td = document.createElement("td");
    }
    table_table.appendChild(current_row);
  }
  function renderPlayerTable(parent, mahjongTable) {
    let innerTable = document.createElement("table");
    let innerRows = [document.createElement("tr"), document.createElement("tr"), document.createElement("tr")];
    innerRows[0].appendChild(document.createElement("td"));
    new PlayerTag(innerRows[0], mahjongTable.table_no, "west", mahjongTable.west);
    innerRows[0].appendChild(document.createElement("td"));
    new PlayerTag(innerRows[1], mahjongTable.table_no, "north", mahjongTable.north);
    let inner_table_display = document.createElement("td");
    inner_table_display.classList.add("mahjong-table-display");
    inner_table_display.textContent = mahjongTable.table_no.toString();
    innerRows[1].appendChild(inner_table_display);
    new PlayerTag(innerRows[1], mahjongTable.table_no, "south", mahjongTable.south);
    innerRows[2].appendChild(document.createElement("td"));
    new PlayerTag(innerRows[2], mahjongTable.table_no, "east", mahjongTable.east);
    let deleteButtonCell = document.createElement("td");
    let deleteButton = new DeleteButton({
      parent: deleteButtonCell,
      tableNo: mahjongTable.table_no
    });
    innerRows[2].appendChild(deleteButtonCell);
    for (const i of innerRows) {
      innerTable.appendChild(i);
    }
    return innerTable;
  }

  // src/index.ts
  function path() {
    return window.location.href.split("/").slice(3).join("/");
  }
  if (["tables", "table"].some((x) => x == path())) {
    document.addEventListener("DOMContentLoaded", onPageRequest);
  }
})();
