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
  var MJ_EVENT_PREFIX = "mj";
  var PointTransferEvent = new Event(`${MJ_EVENT_PREFIX}PointTransfer`);
  async function request(path2, payload, method = "POST") {
    let url = `${window.origin}/` + (path2[0] != "/" ? path2 : path2.slice(1));
    let r = await fetch(url, {
      method,
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      }
    });
    return r;
  }
  async function pointTransfer(payload) {
    let r = await request("/members/transfer", payload, "POST");
    if (!r.ok) {
      console.error("Invalid transfer: ", payload);
      return false;
    }
    window.MJDATA.log.push(payload);
    let updated_members = await r.json();
    let new_member;
    window.MJDATA.members = window.MJDATA.members.map((old_member) => {
      new_member = updated_members.find(
        (new_member2) => new_member2.id === old_member.id
      );
      return new_member !== void 0 ? new_member : old_member;
    });
    document.dispatchEvent(PointTransferEvent);
    return true;
  }
  var RegisterEvent = new Event(`${MJ_EVENT_PREFIX}Register`);
  async function manualRegister(payload) {
    let r = await request("/register", { member_id: payload.memberId }, "POST");
    if (!r.ok) {
      console.error(`${r}`);
      return;
    }
    let present = await r.json();
    window.MJDATA.members = window.MJDATA.members.map((member) => {
      if (member.id === payload.memberId) {
        member.tournament.registered = present;
      }
      return member;
    });
    document.dispatchEvent(RegisterEvent);
  }
  var EditMemberEvent = new Event(`${MJ_EVENT_PREFIX}EditMember`);
  async function editMemberList(payload, mode) {
    let r = await request("/members", payload, mode);
    if (!r.ok) {
      console.error(
        `Failed to ${mode == "POST" ? "create" : "delete"} member "${payload.name}"`
      );
      return;
    }
    if (mode == "DELETE") {
      let member = window.MJDATA.members.find((m) => m.name === payload.name);
      if (!member) {
        console.warn(
          `Couldn't find the deleted member ${payload.name} before removal.`
        );
      } else {
        let index = window.MJDATA.members.indexOf(member);
        window.MJDATA.members.splice(index, 1);
        for (let t of window.MJDATA.tables) {
          if (t.east === member.id) t.east = 0;
          if (t.south === member.id) t.south = 0;
          if (t.west === member.id) t.west = 0;
          if (t.north === member.id) t.north = 0;
        }
      }
    } else {
      window.MJDATA.members.push(await r.json());
    }
    document.dispatchEvent(EditMemberEvent);
  }
  var ResetSessionEvent = new Event(`${MJ_EVENT_PREFIX}ResetSession`);
  async function resetSession() {
    let r = await request("/week", null, "DELETE");
    if (!r.ok) {
      console.error(`Failed to reset the session. ${r}`);
    }
    let m;
    for (m of window.MJDATA.members) {
      m.tournament.registered = false;
      m.tournament.total_points += m.tournament.session_points;
      m.tournament.session_points = 0;
    }
    document.dispatchEvent(ResetSessionEvent);
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

  // src/components/icons.ts
  var IconButton = class extends Component {
    constructor(params) {
      super({
        tag: "button",
        classList: ["icon-button"],
        ...params
      });
      let icon = params.icon;
      this.svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      this.path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      this.svg.appendChild(this.path);
      this.element.appendChild(this.svg);
      if (icon == "fill") {
        this.svg.setAttribute("viewBox", "0 0 576 512");
        this.path.setAttribute(
          "d",
          "M41.4 9.4C53.9-3.1 74.1-3.1 86.6 9.4L168 90.7l53.1-53.1c28.1-28.1 73.7-28.1 101.8 0L474.3 189.1c28.1 28.1 28.1 73.7 0 101.8L283.9 481.4c-37.5 37.5-98.3 37.5-135.8 0L30.6 363.9c-37.5-37.5-37.5-98.3 0-135.8L122.7 136 41.4 54.6c-12.5-12.5-12.5-32.8 0-45.3zm176 221.3L168 181.3 75.9 273.4c-4.2 4.2-7 9.3-8.4 14.6l319.2 0 42.3-42.3c3.1-3.1 3.1-8.2 0-11.3L277.7 82.9c-3.1-3.1-8.2-3.1-11.3 0L213.3 136l49.4 49.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM512 512c-35.3 0-64-28.7-64-64c0-25.2 32.6-79.6 51.2-108.7c6-9.4 19.5-9.4 25.5 0C543.4 368.4 576 422.8 576 448c0 35.3-28.7 64-64 64z"
        );
      } else if (icon == "shuffle") {
        this.svg.setAttribute("viewBox", "0 0 512 512");
        this.path.setAttribute(
          "d",
          "M403.8 34.4c12-5 25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64c-9.2 9.2-22.9 11.9-34.9 6.9s-19.8-16.6-19.8-29.6l0-32-32 0c-10.1 0-19.6 4.7-25.6 12.8L284 229.3 244 176l31.2-41.6C293.3 110.2 321.8 96 352 96l32 0 0-32c0-12.9 7.8-24.6 19.8-29.6zM164 282.7L204 336l-31.2 41.6C154.7 401.8 126.2 416 96 416l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c10.1 0 19.6-4.7 25.6-12.8L164 282.7zm274.6 188c-9.2 9.2-22.9 11.9-34.9 6.9s-19.8-16.6-19.8-29.6l0-32-32 0c-30.2 0-58.7-14.2-76.8-38.4L121.6 172.8c-6-8.1-15.5-12.8-25.6-12.8l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c30.2 0 58.7 14.2 76.8 38.4L326.4 339.2c6 8.1 15.5 12.8 25.6 12.8l32 0 0-32c0-12.9 7.8-24.6 19.8-29.6s25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64z"
        );
      } else if (icon == "reset") {
        this.svg.setAttribute("viewBox", "0 0 516 512");
        this.path.setAttribute(
          "d",
          "M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"
        );
      } else {
        throw new Error(`Unknown icon type ${icon}`);
      }
      this.element.onclick = (ev) => {
        (params.onclick || (() => {
        }))(ev);
        if (ev.defaultPrevented) return;
        this.svg.style.fill = "lime";
        window.setTimeout(() => {
          this.svg.style.transitionDuration = "0.3s";
          this.svg.style.fill = "black";
        });
        window.setTimeout(() => {
          this.svg.style.transitionDuration = "0s";
        }, 300);
      };
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
        if (!m.tournament.registered) continue;
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
  var MahjongUnknownTableError = class extends Error {
    constructor(tableNo) {
      super(`Couldn't find table ${tableNo}`);
      this.name = "MahjongUnknownTableError";
    }
  };
  function getTable(tableNo) {
    let table = window.MJDATA.tables.find((t) => t.table_no === tableNo);
    if (table === void 0) {
      throw new MahjongUnknownTableError(tableNo);
    } else {
      return table;
    }
  }
  var MahjongUnknownMemberError = class extends Error {
    constructor(memberId) {
      let msg = memberId === 0 ? "Attempted to get empty member" : `Couldn't find member ${memberId}`;
      super(msg);
      this.name = "MahjongUnknownMemberError";
    }
  };
  function getMember(memberId, allowEmpty = false) {
    if (memberId === 0) {
      if (allowEmpty) {
        return "EMPTY";
      } else {
        throw new MahjongUnknownMemberError(0);
      }
    }
    let member = window.MJDATA.members.find((m) => m.id === memberId);
    if (member === void 0) {
      throw new MahjongUnknownMemberError(memberId);
    } else {
      return member;
    }
  }
  function getOtherPlayersOnTable(memberId, table, allowEmpty = false) {
    let tableData = typeof table === "number" ? getTable(table) : table;
    let otherSeats = ["east", "south", "west", "north"].filter(
      (seat) => tableData[seat] != memberId
    );
    return otherSeats.map((seat) => {
      let mId = tableData[seat];
      if (mId !== 0) {
        return getMember(mId);
      }
      if (allowEmpty) {
        return "EMPTY";
      } else {
        throw new MahjongUnknownMemberError(0);
      }
    });
  }

  // node_modules/canvas-confetti/dist/confetti.module.mjs
  var module = {};
  (function main(global, module2, isWorker, workerSize) {
    var canUseWorker = !!(global.Worker && global.Blob && global.Promise && global.OffscreenCanvas && global.OffscreenCanvasRenderingContext2D && global.HTMLCanvasElement && global.HTMLCanvasElement.prototype.transferControlToOffscreen && global.URL && global.URL.createObjectURL);
    var canUsePaths = typeof Path2D === "function" && typeof DOMMatrix === "function";
    var canDrawBitmap = function() {
      if (!global.OffscreenCanvas) {
        return false;
      }
      var canvas = new OffscreenCanvas(1, 1);
      var ctx = canvas.getContext("2d");
      ctx.fillRect(0, 0, 1, 1);
      var bitmap = canvas.transferToImageBitmap();
      try {
        ctx.createPattern(bitmap, "no-repeat");
      } catch (e) {
        return false;
      }
      return true;
    }();
    function noop() {
    }
    function promise(func) {
      var ModulePromise = module2.exports.Promise;
      var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise;
      if (typeof Prom === "function") {
        return new Prom(func);
      }
      func(noop, noop);
      return null;
    }
    var bitmapMapper = /* @__PURE__ */ function(skipTransform, map) {
      return {
        transform: function(bitmap) {
          if (skipTransform) {
            return bitmap;
          }
          if (map.has(bitmap)) {
            return map.get(bitmap);
          }
          var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(bitmap, 0, 0);
          map.set(bitmap, canvas);
          return canvas;
        },
        clear: function() {
          map.clear();
        }
      };
    }(canDrawBitmap, /* @__PURE__ */ new Map());
    var raf = function() {
      var TIME = Math.floor(1e3 / 60);
      var frame, cancel;
      var frames = {};
      var lastFrameTime = 0;
      if (typeof requestAnimationFrame === "function" && typeof cancelAnimationFrame === "function") {
        frame = function(cb) {
          var id = Math.random();
          frames[id] = requestAnimationFrame(function onFrame(time) {
            if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
              lastFrameTime = time;
              delete frames[id];
              cb();
            } else {
              frames[id] = requestAnimationFrame(onFrame);
            }
          });
          return id;
        };
        cancel = function(id) {
          if (frames[id]) {
            cancelAnimationFrame(frames[id]);
          }
        };
      } else {
        frame = function(cb) {
          return setTimeout(cb, TIME);
        };
        cancel = function(timer) {
          return clearTimeout(timer);
        };
      }
      return { frame, cancel };
    }();
    var getWorker = /* @__PURE__ */ function() {
      var worker;
      var prom;
      var resolves = {};
      function decorate(worker2) {
        function execute(options, callback) {
          worker2.postMessage({ options: options || {}, callback });
        }
        worker2.init = function initWorker(canvas) {
          var offscreen = canvas.transferControlToOffscreen();
          worker2.postMessage({ canvas: offscreen }, [offscreen]);
        };
        worker2.fire = function fireWorker(options, size, done) {
          if (prom) {
            execute(options, null);
            return prom;
          }
          var id = Math.random().toString(36).slice(2);
          prom = promise(function(resolve) {
            function workerDone(msg) {
              if (msg.data.callback !== id) {
                return;
              }
              delete resolves[id];
              worker2.removeEventListener("message", workerDone);
              prom = null;
              bitmapMapper.clear();
              done();
              resolve();
            }
            worker2.addEventListener("message", workerDone);
            execute(options, id);
            resolves[id] = workerDone.bind(null, { data: { callback: id } });
          });
          return prom;
        };
        worker2.reset = function resetWorker() {
          worker2.postMessage({ reset: true });
          for (var id in resolves) {
            resolves[id]();
            delete resolves[id];
          }
        };
      }
      return function() {
        if (worker) {
          return worker;
        }
        if (!isWorker && canUseWorker) {
          var code = [
            "var CONFETTI, SIZE = {}, module = {};",
            "(" + main.toString() + ")(this, module, true, SIZE);",
            "onmessage = function(msg) {",
            "  if (msg.data.options) {",
            "    CONFETTI(msg.data.options).then(function () {",
            "      if (msg.data.callback) {",
            "        postMessage({ callback: msg.data.callback });",
            "      }",
            "    });",
            "  } else if (msg.data.reset) {",
            "    CONFETTI && CONFETTI.reset();",
            "  } else if (msg.data.resize) {",
            "    SIZE.width = msg.data.resize.width;",
            "    SIZE.height = msg.data.resize.height;",
            "  } else if (msg.data.canvas) {",
            "    SIZE.width = msg.data.canvas.width;",
            "    SIZE.height = msg.data.canvas.height;",
            "    CONFETTI = module.exports.create(msg.data.canvas);",
            "  }",
            "}"
          ].join("\n");
          try {
            worker = new Worker(URL.createObjectURL(new Blob([code])));
          } catch (e) {
            typeof console !== void 0 && typeof console.warn === "function" ? console.warn("\u{1F38A} Could not load worker", e) : null;
            return null;
          }
          decorate(worker);
        }
        return worker;
      };
    }();
    var defaults = {
      particleCount: 50,
      angle: 90,
      spread: 45,
      startVelocity: 45,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      x: 0.5,
      y: 0.5,
      shapes: ["square", "circle"],
      zIndex: 100,
      colors: [
        "#26ccff",
        "#a25afd",
        "#ff5e7e",
        "#88ff5a",
        "#fcff42",
        "#ffa62d",
        "#ff36ff"
      ],
      // probably should be true, but back-compat
      disableForReducedMotion: false,
      scalar: 1
    };
    function convert(val, transform) {
      return transform ? transform(val) : val;
    }
    function isOk(val) {
      return !(val === null || val === void 0);
    }
    function prop(options, name, transform) {
      return convert(
        options && isOk(options[name]) ? options[name] : defaults[name],
        transform
      );
    }
    function onlyPositiveInt(number) {
      return number < 0 ? 0 : Math.floor(number);
    }
    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }
    function toDecimal(str) {
      return parseInt(str, 16);
    }
    function colorsToRgb(colors) {
      return colors.map(hexToRgb);
    }
    function hexToRgb(str) {
      var val = String(str).replace(/[^0-9a-f]/gi, "");
      if (val.length < 6) {
        val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
      }
      return {
        r: toDecimal(val.substring(0, 2)),
        g: toDecimal(val.substring(2, 4)),
        b: toDecimal(val.substring(4, 6))
      };
    }
    function getOrigin(options) {
      var origin = prop(options, "origin", Object);
      origin.x = prop(origin, "x", Number);
      origin.y = prop(origin, "y", Number);
      return origin;
    }
    function setCanvasWindowSize(canvas) {
      canvas.width = document.documentElement.clientWidth;
      canvas.height = document.documentElement.clientHeight;
    }
    function setCanvasRectSize(canvas) {
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    function getCanvas(zIndex) {
      var canvas = document.createElement("canvas");
      canvas.style.position = "fixed";
      canvas.style.top = "0px";
      canvas.style.left = "0px";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = zIndex;
      return canvas;
    }
    function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.scale(radiusX, radiusY);
      context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
      context.restore();
    }
    function randomPhysics(opts) {
      var radAngle = opts.angle * (Math.PI / 180);
      var radSpread = opts.spread * (Math.PI / 180);
      return {
        x: opts.x,
        y: opts.y,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
        velocity: opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
        angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
        tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
        color: opts.color,
        shape: opts.shape,
        tick: 0,
        totalTicks: opts.ticks,
        decay: opts.decay,
        drift: opts.drift,
        random: Math.random() + 2,
        tiltSin: 0,
        tiltCos: 0,
        wobbleX: 0,
        wobbleY: 0,
        gravity: opts.gravity * 3,
        ovalScalar: 0.6,
        scalar: opts.scalar,
        flat: opts.flat
      };
    }
    function updateFetti(context, fetti) {
      fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
      fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
      fetti.velocity *= fetti.decay;
      if (fetti.flat) {
        fetti.wobble = 0;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar;
        fetti.wobbleY = fetti.y + 10 * fetti.scalar;
        fetti.tiltSin = 0;
        fetti.tiltCos = 0;
        fetti.random = 1;
      } else {
        fetti.wobble += fetti.wobbleSpeed;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar * Math.cos(fetti.wobble);
        fetti.wobbleY = fetti.y + 10 * fetti.scalar * Math.sin(fetti.wobble);
        fetti.tiltAngle += 0.1;
        fetti.tiltSin = Math.sin(fetti.tiltAngle);
        fetti.tiltCos = Math.cos(fetti.tiltAngle);
        fetti.random = Math.random() + 2;
      }
      var progress = fetti.tick++ / fetti.totalTicks;
      var x1 = fetti.x + fetti.random * fetti.tiltCos;
      var y1 = fetti.y + fetti.random * fetti.tiltSin;
      var x2 = fetti.wobbleX + fetti.random * fetti.tiltCos;
      var y2 = fetti.wobbleY + fetti.random * fetti.tiltSin;
      context.fillStyle = "rgba(" + fetti.color.r + ", " + fetti.color.g + ", " + fetti.color.b + ", " + (1 - progress) + ")";
      context.beginPath();
      if (canUsePaths && fetti.shape.type === "path" && typeof fetti.shape.path === "string" && Array.isArray(fetti.shape.matrix)) {
        context.fill(transformPath2D(
          fetti.shape.path,
          fetti.shape.matrix,
          fetti.x,
          fetti.y,
          Math.abs(x2 - x1) * 0.1,
          Math.abs(y2 - y1) * 0.1,
          Math.PI / 10 * fetti.wobble
        ));
      } else if (fetti.shape.type === "bitmap") {
        var rotation = Math.PI / 10 * fetti.wobble;
        var scaleX = Math.abs(x2 - x1) * 0.1;
        var scaleY = Math.abs(y2 - y1) * 0.1;
        var width = fetti.shape.bitmap.width * fetti.scalar;
        var height = fetti.shape.bitmap.height * fetti.scalar;
        var matrix = new DOMMatrix([
          Math.cos(rotation) * scaleX,
          Math.sin(rotation) * scaleX,
          -Math.sin(rotation) * scaleY,
          Math.cos(rotation) * scaleY,
          fetti.x,
          fetti.y
        ]);
        matrix.multiplySelf(new DOMMatrix(fetti.shape.matrix));
        var pattern = context.createPattern(bitmapMapper.transform(fetti.shape.bitmap), "no-repeat");
        pattern.setTransform(matrix);
        context.globalAlpha = 1 - progress;
        context.fillStyle = pattern;
        context.fillRect(
          fetti.x - width / 2,
          fetti.y - height / 2,
          width,
          height
        );
        context.globalAlpha = 1;
      } else if (fetti.shape === "circle") {
        context.ellipse ? context.ellipse(fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI) : ellipse(context, fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI);
      } else if (fetti.shape === "star") {
        var rot = Math.PI / 2 * 3;
        var innerRadius = 4 * fetti.scalar;
        var outerRadius = 8 * fetti.scalar;
        var x = fetti.x;
        var y = fetti.y;
        var spikes = 5;
        var step = Math.PI / spikes;
        while (spikes--) {
          x = fetti.x + Math.cos(rot) * outerRadius;
          y = fetti.y + Math.sin(rot) * outerRadius;
          context.lineTo(x, y);
          rot += step;
          x = fetti.x + Math.cos(rot) * innerRadius;
          y = fetti.y + Math.sin(rot) * innerRadius;
          context.lineTo(x, y);
          rot += step;
        }
      } else {
        context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
        context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
        context.lineTo(Math.floor(x2), Math.floor(y2));
        context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
      }
      context.closePath();
      context.fill();
      return fetti.tick < fetti.totalTicks;
    }
    function animate(canvas, fettis, resizer, size, done) {
      var animatingFettis = fettis.slice();
      var context = canvas.getContext("2d");
      var animationFrame;
      var destroy;
      var prom = promise(function(resolve) {
        function onDone() {
          animationFrame = destroy = null;
          context.clearRect(0, 0, size.width, size.height);
          bitmapMapper.clear();
          done();
          resolve();
        }
        function update() {
          if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
            size.width = canvas.width = workerSize.width;
            size.height = canvas.height = workerSize.height;
          }
          if (!size.width && !size.height) {
            resizer(canvas);
            size.width = canvas.width;
            size.height = canvas.height;
          }
          context.clearRect(0, 0, size.width, size.height);
          animatingFettis = animatingFettis.filter(function(fetti) {
            return updateFetti(context, fetti);
          });
          if (animatingFettis.length) {
            animationFrame = raf.frame(update);
          } else {
            onDone();
          }
        }
        animationFrame = raf.frame(update);
        destroy = onDone;
      });
      return {
        addFettis: function(fettis2) {
          animatingFettis = animatingFettis.concat(fettis2);
          return prom;
        },
        canvas,
        promise: prom,
        reset: function() {
          if (animationFrame) {
            raf.cancel(animationFrame);
          }
          if (destroy) {
            destroy();
          }
        }
      };
    }
    function confettiCannon(canvas, globalOpts) {
      var isLibCanvas = !canvas;
      var allowResize = !!prop(globalOpts || {}, "resize");
      var hasResizeEventRegistered = false;
      var globalDisableForReducedMotion = prop(globalOpts, "disableForReducedMotion", Boolean);
      var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, "useWorker");
      var worker = shouldUseWorker ? getWorker() : null;
      var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
      var initialized = canvas && worker ? !!canvas.__confetti_initialized : false;
      var preferLessMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion)").matches;
      var animationObj;
      function fireLocal(options, size, done) {
        var particleCount = prop(options, "particleCount", onlyPositiveInt);
        var angle = prop(options, "angle", Number);
        var spread = prop(options, "spread", Number);
        var startVelocity = prop(options, "startVelocity", Number);
        var decay = prop(options, "decay", Number);
        var gravity = prop(options, "gravity", Number);
        var drift = prop(options, "drift", Number);
        var colors = prop(options, "colors", colorsToRgb);
        var ticks = prop(options, "ticks", Number);
        var shapes = prop(options, "shapes");
        var scalar = prop(options, "scalar");
        var flat = !!prop(options, "flat");
        var origin = getOrigin(options);
        var temp = particleCount;
        var fettis = [];
        var startX = canvas.width * origin.x;
        var startY = canvas.height * origin.y;
        while (temp--) {
          fettis.push(
            randomPhysics({
              x: startX,
              y: startY,
              angle,
              spread,
              startVelocity,
              color: colors[temp % colors.length],
              shape: shapes[randomInt(0, shapes.length)],
              ticks,
              decay,
              gravity,
              drift,
              scalar,
              flat
            })
          );
        }
        if (animationObj) {
          return animationObj.addFettis(fettis);
        }
        animationObj = animate(canvas, fettis, resizer, size, done);
        return animationObj.promise;
      }
      function fire(options) {
        var disableForReducedMotion = globalDisableForReducedMotion || prop(options, "disableForReducedMotion", Boolean);
        var zIndex = prop(options, "zIndex", Number);
        if (disableForReducedMotion && preferLessMotion) {
          return promise(function(resolve) {
            resolve();
          });
        }
        if (isLibCanvas && animationObj) {
          canvas = animationObj.canvas;
        } else if (isLibCanvas && !canvas) {
          canvas = getCanvas(zIndex);
          document.body.appendChild(canvas);
        }
        if (allowResize && !initialized) {
          resizer(canvas);
        }
        var size = {
          width: canvas.width,
          height: canvas.height
        };
        if (worker && !initialized) {
          worker.init(canvas);
        }
        initialized = true;
        if (worker) {
          canvas.__confetti_initialized = true;
        }
        function onResize() {
          if (worker) {
            var obj = {
              getBoundingClientRect: function() {
                if (!isLibCanvas) {
                  return canvas.getBoundingClientRect();
                }
              }
            };
            resizer(obj);
            worker.postMessage({
              resize: {
                width: obj.width,
                height: obj.height
              }
            });
            return;
          }
          size.width = size.height = null;
        }
        function done() {
          animationObj = null;
          if (allowResize) {
            hasResizeEventRegistered = false;
            global.removeEventListener("resize", onResize);
          }
          if (isLibCanvas && canvas) {
            if (document.body.contains(canvas)) {
              document.body.removeChild(canvas);
            }
            canvas = null;
            initialized = false;
          }
        }
        if (allowResize && !hasResizeEventRegistered) {
          hasResizeEventRegistered = true;
          global.addEventListener("resize", onResize, false);
        }
        if (worker) {
          return worker.fire(options, size, done);
        }
        return fireLocal(options, size, done);
      }
      fire.reset = function() {
        if (worker) {
          worker.reset();
        }
        if (animationObj) {
          animationObj.reset();
        }
      };
      return fire;
    }
    var defaultFire;
    function getDefaultFire() {
      if (!defaultFire) {
        defaultFire = confettiCannon(null, { useWorker: true, resize: true });
      }
      return defaultFire;
    }
    function transformPath2D(pathString, pathMatrix, x, y, scaleX, scaleY, rotation) {
      var path2d = new Path2D(pathString);
      var t1 = new Path2D();
      t1.addPath(path2d, new DOMMatrix(pathMatrix));
      var t2 = new Path2D();
      t2.addPath(t1, new DOMMatrix([
        Math.cos(rotation) * scaleX,
        Math.sin(rotation) * scaleX,
        -Math.sin(rotation) * scaleY,
        Math.cos(rotation) * scaleY,
        x,
        y
      ]));
      return t2;
    }
    function shapeFromPath(pathData) {
      if (!canUsePaths) {
        throw new Error("path confetti are not supported in this browser");
      }
      var path2, matrix;
      if (typeof pathData === "string") {
        path2 = pathData;
      } else {
        path2 = pathData.path;
        matrix = pathData.matrix;
      }
      var path2d = new Path2D(path2);
      var tempCanvas = document.createElement("canvas");
      var tempCtx = tempCanvas.getContext("2d");
      if (!matrix) {
        var maxSize = 1e3;
        var minX = maxSize;
        var minY = maxSize;
        var maxX = 0;
        var maxY = 0;
        var width, height;
        for (var x = 0; x < maxSize; x += 2) {
          for (var y = 0; y < maxSize; y += 2) {
            if (tempCtx.isPointInPath(path2d, x, y, "nonzero")) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
        width = maxX - minX;
        height = maxY - minY;
        var maxDesiredSize = 10;
        var scale = Math.min(maxDesiredSize / width, maxDesiredSize / height);
        matrix = [
          scale,
          0,
          0,
          scale,
          -Math.round(width / 2 + minX) * scale,
          -Math.round(height / 2 + minY) * scale
        ];
      }
      return {
        type: "path",
        path: path2,
        matrix
      };
    }
    function shapeFromText(textData) {
      var text, scalar = 1, color = "#000000", fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';
      if (typeof textData === "string") {
        text = textData;
      } else {
        text = textData.text;
        scalar = "scalar" in textData ? textData.scalar : scalar;
        fontFamily = "fontFamily" in textData ? textData.fontFamily : fontFamily;
        color = "color" in textData ? textData.color : color;
      }
      var fontSize = 10 * scalar;
      var font = "" + fontSize + "px " + fontFamily;
      var canvas = new OffscreenCanvas(fontSize, fontSize);
      var ctx = canvas.getContext("2d");
      ctx.font = font;
      var size = ctx.measureText(text);
      var width = Math.ceil(size.actualBoundingBoxRight + size.actualBoundingBoxLeft);
      var height = Math.ceil(size.actualBoundingBoxAscent + size.actualBoundingBoxDescent);
      var padding = 2;
      var x = size.actualBoundingBoxLeft + padding;
      var y = size.actualBoundingBoxAscent + padding;
      width += padding + padding;
      height += padding + padding;
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext("2d");
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      var scale = 1 / scalar;
      return {
        type: "bitmap",
        // TODO these probably need to be transfered for workers
        bitmap: canvas.transferToImageBitmap(),
        matrix: [scale, 0, 0, scale, -width * scale / 2, -height * scale / 2]
      };
    }
    module2.exports = function() {
      return getDefaultFire().apply(this, arguments);
    };
    module2.exports.reset = function() {
      getDefaultFire().reset();
    };
    module2.exports.create = confettiCannon;
    module2.exports.shapeFromPath = shapeFromPath;
    module2.exports.shapeFromText = shapeFromText;
  })(function() {
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof self !== "undefined") {
      return self;
    }
    return this || {};
  }(), module, false);
  var confetti_module_default = module.exports;
  var create = module.exports.create;

  // src/components/successAnim.ts
  var mahjongConfetti = {
    shapes: [confetti_module_default.shapeFromText({ text: "\u{1F004}", scalar: 4 })],
    scalar: 3
  };
  var goldConfetti = { colors: ["#ffd700"], scalar: 1 };
  function triggerCelebration() {
    var end = Date.now() + 1 * 1e3;
    let defaultSettings = {
      particleCount: 3,
      spread: 100,
      startVelocity: 90
    };
    (function frame() {
      confetti_module_default({
        angle: 75,
        origin: { x: 0, y: 1 },
        ...defaultSettings,
        ...goldConfetti
      });
      confetti_module_default({
        angle: 75,
        origin: { x: 0, y: 1 },
        ...defaultSettings,
        ...mahjongConfetti
      });
      confetti_module_default({
        angle: 105,
        origin: { x: 1, y: 1 },
        ...defaultSettings,
        ...goldConfetti
      });
      confetti_module_default({
        angle: 105,
        origin: { x: 1, y: 1 },
        ...defaultSettings,
        ...mahjongConfetti
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  // src/components/player.ts
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
  TEMP_TABLE.set(-10, -128);
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
      try {
        this.element.title = `${this.member.name} won!`;
      } catch {
        console.warn(`Failed to get ${this.memberId}`);
      }
      this.zimo = new FaanDropdownButton({
        textContent: "\u81EA\u6478",
        includePenalty: true,
        parent: this.popup.element,
        // don't set onclick here - do it in updatePlayers
        other: {
          title: "Self-draw"
        }
      });
      this.dachut = new DropdownButton({
        textContent: "\u6253\u51FA",
        parent: this.popup.element,
        // don't set onclick here - do it in updatePlayers
        other: {
          title: "From another's tile"
        }
      });
      this.baozimo = new DropdownButton({
        textContent: "\u5305\u81EA\u6478",
        parent: this.popup.element,
        other: {
          title: "(special case)"
        }
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
    async onclickPointTransfer(losers, points) {
      let success = await pointTransfer({
        to: this.memberId,
        from: losers.map((m) => {
          if (m === "EMPTY") {
            throw new MahjongUnknownMemberError(0);
          }
          return m.id;
        }),
        points
      });
      if (success) {
        if (points === 256 || points === 128 && losers.length > 1) {
          triggerCelebration();
        }
        this.deactivate();
      } else {
        alert("Please reload the page and try again. Sorry!");
      }
    }
    updatePlayers() {
      let table = this.table;
      let member = this.member;
      let otherPlayers = getOtherPlayersOnTable(member.id, table, true);
      this.dachut.dropdown.options = otherPlayers.map(
        (m) => new FaanDropdownButton({
          textContent: m === "EMPTY" ? m : m.name,
          classList: ["small-button"],
          onclick: async (ev, faan) => this.onclickPointTransfer(
            [m],
            getPointsFromFaan(faan) * 2
          ),
          other: {
            title: ""
          }
        }).element
      );
      this.baozimo.dropdown.options = otherPlayers.map(
        (m) => new FaanDropdownButton({
          textContent: m === "EMPTY" ? m : m.name,
          classList: ["small-button"],
          onclick: async (ev, faan) => this.onclickPointTransfer(
            [m],
            getPointsFromFaan(faan) * 3
          ),
          other: {
            title: ""
          }
        }).element
      );
      this.zimo.onclick = async (ev, faan) => this.onclickPointTransfer(otherPlayers, getPointsFromFaan(faan));
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
      let max = params.max || 10;
      let faanRange = Array.from(Array(max + 1).keys()).slice(min);
      if (params.includePenalty) faanRange.push(-10);
      let passedOnclick = params.onclick;
      if (!passedOnclick) passedOnclick = () => {
      };
      let onclick;
      let options = faanRange.map((faan) => {
        onclick = (ev) => passedOnclick(ev, faan);
        return new Component({
          tag: "button",
          classList: ["small-button"],
          textContent: faan == -10 ? "Penalty" : faan.toString(),
          other: {
            onclick,
            title: ""
          }
        }).element;
      });
      super({ ...params, options });
      this.min = min;
      this.max = max;
      this.includePenalty = params.includePenalty || false;
      this._onclick = passedOnclick;
    }
    get onclick() {
      return this._onclick;
    }
    set onclick(v) {
      let faanRange = Array.from(Array(this.max + 1).keys()).slice(this.min);
      if (this.includePenalty) faanRange.push(-10);
      this.dropdown.options = faanRange.map((faan) => {
        let func = (ev) => v(ev, faan);
        return new Component({
          tag: "button",
          classList: ["small-button"],
          textContent: faan === -10 ? "Penalty" : faan.toString(),
          other: {
            onclick: func,
            title: ""
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
      let me = getMember(table[this.seat], true);
      this.nameTag = new NameTag({
        classList: ["name-tag", this.seat],
        parent: this.element,
        value: me === "EMPTY" ? void 0 : me
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
        let newMember = getMember(newMemberId);
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
  async function allocateSeats(seatAbsent = false) {
    for (let mem of window.MJDATA.members) {
      if (!isSat(mem) && (seatAbsent || mem.tournament.registered)) {
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
      table = getTable(tablen);
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
      super({
        tag: "dialog",
        ...params
      });
      this.excludeSelf = false;
      if (activator.element === params.parent) {
        console.warn(
          `Setting the activator as a parent of the ${this} dialog will mean that whenever it is clicked it is reactivated. To bypass this warning, manually add the child node.`
        );
      }
      this.activator = activator;
      let dialog = this;
      this.activator.element.addEventListener("click", (ev) => {
        this.activate();
      });
      this.exclude.push(this.activator.element);
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
  var ConfirmationDialog = class extends Dialog {
    constructor(params) {
      super(params);
      this.element.style.maxWidth = "50%";
      this.div = new Component({
        tag: "div",
        parent: this.element
      });
      this.div.element.style.width = "100%";
      this.div.element.style.height = "100%";
      this.p = new Component({
        tag: "p",
        parent: this.div.element,
        other: {
          innerHTML: params.message.replace("\n", "<br/>")
        }
      });
      this.p.element.style.width = "100%";
      this.buttonsDiv = new Component({
        tag: "div",
        parent: this.div.element
      });
      this.buttonsDiv.element.style.display = "flex";
      this.buttonsDiv.element.style.justifyContent = "center";
      this.confirm = new Component({
        tag: "button",
        textContent: "Yes",
        parent: this.buttonsDiv.element
      });
      this.cancel = new Component({
        tag: "button",
        textContent: "Cancel",
        parent: this.buttonsDiv.element
      });
      this.confirm.element.style.fontSize = "16px";
      this.cancel.element.style.fontSize = "16px";
      this.confirm.element.style.margin = "0 1em 1em 1em";
      this.cancel.element.style.margin = "0 1em 1em 1em";
      this.confirm.element.style.padding = "4px";
      this.cancel.element.style.padding = "4px";
      this.onconfirm = params.onconfirm;
      this.oncancel = params.oncancel === void 0 ? () => {
      } : params.oncancel;
      this.updateButtons();
    }
    updateButtons() {
      this.cancel.element.onclick = (ev) => {
        this.oncancel(ev);
        if (!ev.defaultPrevented) {
          this.deactivate();
        }
      };
      this.confirm.element.onclick = this.onconfirm;
    }
  };

  // src/components/memberTable.ts
  var MemberGrid = class extends Component {
    constructor(params) {
      super({
        tag: "table",
        ...params
      });
      this.memberElems = {};
      this.updateMembers();
      document.addEventListener("mjPointTransfer", () => {
        this.updateMembers();
      });
      this.showAbsent = false;
    }
    renderNewHeaders() {
      this.element.innerHTML = "";
      let headerRow = new Component({
        tag: "tr",
        parent: this.element
      });
      let name = new Component({
        tag: "th",
        textContent: "Name",
        parent: headerRow.element
      });
      let points = new Component({
        tag: "th",
        textContent: this.showAbsent ? "Total" : "Pts.",
        parent: headerRow.element
      });
      if (!this.showAbsent) return;
      let present = new Component({
        tag: "th",
        textContent: "Reg.",
        parent: headerRow.element
      });
      present.element.style.fontSize = "12px";
    }
    updateMembers() {
      this.renderNewHeaders();
      [...window.MJDATA.members].sort((a, b) => {
        if (this.showAbsent) {
          return b.tournament.total_points - a.tournament.total_points;
        } else {
          return b.tournament.session_points - a.tournament.session_points;
        }
      }).forEach((m) => this.renderLi(m));
    }
    renderLi(member) {
      if (!member.tournament.registered && !this.showAbsent) return;
      let row = new Component({
        tag: "tr",
        parent: this.element
      });
      let name = new Component({
        tag: "td",
        textContent: member.name,
        parent: row.element
      });
      if (this.showAbsent && member.tournament.registered) {
        name.element.style["fontWeight"] = "bold";
      }
      let pointsTd = new PointsTd({
        points: this.showAbsent ? member.tournament.total_points : member.tournament.session_points,
        parent: row.element
      });
      if (!this.showAbsent) {
        return;
      }
      let presentTd = new Component({
        tag: "td",
        parent: row.element
      });
      let checkbox = new Component({
        tag: "input",
        classList: ["present-checkbox"],
        parent: presentTd.element,
        other: {
          type: "checkbox",
          checked: member.tournament.registered,
          onchange: async () => {
            await manualRegister({ memberId: member.id });
          }
        }
      });
    }
  };
  var PointsTd = class extends Component {
    constructor(params) {
      super({
        tag: "td",
        textContent: params.points.toString(),
        ...params
      });
      this.element.style["backgroundColor"] = params.points > 0 ? "green" : params.points === 0 ? "yellow" : "red";
    }
  };

  // src/components/sidebar.ts
  function renderSidebar() {
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
      if (window.innerWidth < 900) {
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
    let editMembersBar = new EditMembersBar({ parent: innerSidebar.element });
    let form = document.getElementById("name")?.parentElement;
    if (!(form instanceof HTMLFormElement)) {
      throw Error("no form");
    }
    let addMemberDialog = document.getElementById("add-member-dialog");
    if (!(addMemberDialog instanceof HTMLDialogElement))
      throw new Error("Couldn't find add member dialog");
    let dialog = new Dialog({
      element: addMemberDialog,
      activator: editMembersBar.addButton
    });
    let memberList = new MemberGrid({
      parent: innerSidebar.element,
      classList: ["info-grid"]
    });
    document.addEventListener("mjEditMember", (ev) => {
      memberList.updateMembers();
      editMembersBar.removeButton.update();
      editMembersBar.register.updateMembers();
      dialog.deactivate();
    });
    document.addEventListener("mjRegister", (ev) => {
      memberList.updateMembers();
      editMembersBar.register.input.element.value = "";
    });
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      let name = new FormData(form).get("name")?.toString();
      if (!name) {
        throw Error("no name");
      }
      await editMemberList({ name }, "POST");
    };
    editMembersBar.checkbox.element.onchange = () => {
      memberList.showAbsent = editMembersBar.checkbox.element.checked;
      memberList.updateMembers();
    };
  }
  var EditMembersBar = class extends Component {
    constructor(params) {
      super({
        tag: "div",
        ...params
      });
      this.topDiv = new Component({
        tag: "div",
        parent: this.element
      });
      this.register = new Register({ parent: this.topDiv.element });
      this.checkbox = new Component({
        tag: "input",
        parent: this.topDiv.element,
        classList: ["register-checkbox"],
        other: {
          title: "Show all members?",
          type: "checkbox"
        }
      });
      this.resetButton = new IconButton({
        icon: "reset",
        parent: this.topDiv.element,
        other: {
          title: "Reset the session (prompted to confirm)"
        }
      });
      let confirmation = new ConfirmationDialog({
        activator: this.resetButton,
        parent: this.topDiv.element,
        // NOT INSIDE THE BUTTON otherwise it will reactivate itself
        message: "Are you sure you want to reset the session?\n\nThis will sum the current points to each member's total points. This cannot be undone. It will also mark everyone as absent.",
        onconfirm: (ev) => resetSession()
      });
      this.bottomDiv = new Component({
        tag: "div",
        parent: this.element
      });
      this.addButton = new Component({
        tag: "button",
        classList: ["member-button"],
        parent: this.bottomDiv.element,
        textContent: "New member",
        other: {
          id: "add-member"
        }
      });
      this.removeButton = new RemoveMemberButton({
        parent: this.bottomDiv.element
      });
      this.topDiv.element.style["display"] = "flex";
      this.bottomDiv.element.style["display"] = "flex";
    }
  };
  var RemoveMemberButton = class extends DropdownButton {
    constructor(params) {
      super({
        textContent: "Delete member",
        classList: ["member-button"],
        options: [],
        ...params
      });
      this.update();
    }
    update() {
      this.dropdown.options = window.MJDATA.members.map(
        (m) => new Component({
          tag: "button",
          textContent: m.name,
          other: {
            onclick: async (ev) => editMemberList({ name: m.name }, "DELETE")
          }
        }).element
      );
    }
  };
  var Register = class extends Component {
    constructor(params) {
      super({
        tag: "form",
        classList: ["register"],
        ...params
      });
      this.label = new Component({
        tag: "label",
        textContent: "Register",
        parent: this.element,
        other: {
          htmlFor: "register"
        }
      });
      this.datalist = new Component({
        tag: "datalist",
        parent: this.element,
        other: {
          id: "registerList"
        }
      });
      this.updateMembers();
      this.input = new Component({
        tag: "input",
        parent: this.element,
        other: {
          id: "register"
        }
      });
      this.input.element.setAttribute("list", "registerList");
      this.input.element.style["fontSize"] = "14px";
      this.element.onsubmit = (ev) => {
        ev.preventDefault();
        let memberId = window.MJDATA.members.find(
          (m) => m.name == this.input.element.value.trim()
        )?.id;
        if (memberId === void 0) throw new Error("no id AJDSBFI");
        manualRegister({ memberId });
      };
    }
    updateMembers() {
      this.datalist.element.innerHTML = "";
      let member;
      for (member of window.MJDATA.members) {
        this.renderOption(member);
      }
    }
    renderOption(member) {
      let option = new Component({
        tag: "option",
        parent: this.datalist.element,
        textContent: member.name
      });
    }
  };

  // src/pages/tables.ts
  function tables() {
    renderTables();
    document.addEventListener("mjEditMember", (ev) => renderTables());
    renderSidebar();
    renderHeader();
    document.addEventListener("mjResetSession", (ev) => {
      renderSidebar();
      renderTables();
    });
  }
  function renderHeader() {
    let headerBar = document.getElementById("header-bar");
    if (headerBar == void 0) {
      throw Error("No element with header-bar id");
    }
    let sit = new IconButton({
      icon: "fill",
      onclick: async (ev) => {
        await allocateSeats();
        renderTables();
      },
      other: {
        title: "Fill seats with players"
      }
    });
    headerBar.children[0].insertAdjacentElement("beforebegin", sit.element);
    let shuffle = new IconButton({
      icon: "shuffle",
      parent: headerBar,
      onclick: async (ev) => {
        await shuffleSeats();
        renderTables();
        let tablesGrid = document.getElementById("table");
        if (!tablesGrid) throw new Error("Couldn't find #table");
        tablesGrid.style.animation = "shake 0.2s";
        window.setTimeout(() => tablesGrid.style.animation = "", 200);
      },
      other: {
        title: "Randomize seating"
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

  // src/pages/log.ts
  function logPage() {
    let logTable = document.getElementById("log-table");
    if (!(logTable instanceof HTMLTableElement)) {
      throw Error("Couldn't get log-table <table> element.");
    }
    logTable.classList.add("info-grid");
    renderLogsTable(logTable);
  }
  function renderLogsTable(parent) {
    parent.innerHTML = "";
    let headerRow = document.createElement("tr");
    parent.appendChild(headerRow);
    let points = document.createElement("th");
    points.textContent = "Points won (per loser)";
    points.style["width"] = "20%";
    headerRow.appendChild(points);
    let winner = document.createElement("th");
    winner.textContent = "Winner";
    headerRow.appendChild(winner);
    let losers = document.createElement("th");
    losers.textContent = "Loser(s)";
    headerRow.appendChild(losers);
    let reverseLog = window.MJDATA.log;
    reverseLog.reverse();
    for (let pt of reverseLog) {
      let logRow = new LogRow({
        parent,
        transfer: pt
      });
    }
  }
  var LogRow = class extends Component {
    constructor(params) {
      super({
        tag: "tr",
        ...params
      });
      this.points = new Component({
        tag: "td",
        parent: this.element,
        textContent: params.transfer.points.toString()
      });
      this.to = new Component({
        tag: "td",
        parent: this.element,
        textContent: getMember(params.transfer.to).name
      });
      this.from = new Component({
        tag: "td",
        parent: this.element,
        textContent: params.transfer.from.map((mId) => getMember(mId).name).join(",")
      });
    }
  };

  // src/index.ts
  function path() {
    return window.location.href.split("/").slice(3).join("/");
  }
  if (["tables", "table"].some((x) => x === path())) {
    document.addEventListener("DOMContentLoaded", tables);
  } else if (path() === "qr") {
    displayQR;
  } else if (path() === "log") {
    document.addEventListener("DOMContentLoaded", logPage);
  }
})();
