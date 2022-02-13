/* inject trick 

const addScript = (src, callback) => {
  var s = document.createElement("script");
  s.setAttribute("src", src);
  s.onload = callback;
  document.body.appendChild(s);
};

addScript(
  "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js",
  () => {
    addScript(
      "https://cdnjs.cloudflare.com/ajax/libs/json2html/2.1.0/json2html.min.js"
    );
  }
);

/* inject trick */

let styl = document.createElement("style");
document.head.appendChild(styl);
styl.innerHTML =
  '@import "https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css";';
styl.innerHTML += `html{ overflow:hidden }
.alert-background{
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 999;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(5px);
}
.win-alert{
    z-index: 1000!important;
}
.is-fixed{
    position: fixed;
    z-index: 99;
    top:0;
    left:0;
}

.window {
    min-width: 140px;
    /* min-height: 100px; */
    padding: 0;
    overflow: hidden;
    border-radius: 0px;
}
.window header{
    user-select: none;
}
.window header span{
    width: calc(100% - 18px);
    display: block;
    padding: 5px;
    font-size: 12px!important;
    height:28px;
}
.window header button{
    width: 18px;
    height: 28px;
    padding: 0;
    line-height: normal;
    font-size: 10px!important;
}
.window-content{
    padding: 5px;
    font-size: 12px!important;
    max-height: 600px;
    max-width: 400px;
    overflow: auto
}
`;

let app = document.createElement("div");
app.id = "DOM";
document.body.appendChild(app);

/* helper */
window._json2html = {
  events:
    "blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu",
  setupListeners(el) {
    this.events.split(" ").forEach((ev) => {
      $(el).on(ev, function (e) {
        $(this).attr("data-" + ev, "true");
      });
    });
  },
  offListeners(el) {
    this.events.split(" ").forEach((ev) => {
      // $(el).attr('data-'+ev, 'false')
      $(el).removeAttr("data-" + ev);
    });
  },
  newEl(type = "div", opts = false) {
    let el = {
      "<>": type,
    };
    if (opts)
      Object.keys(opts).forEach((attr) => {
        el[attr] = opts[attr];
      });
    return el;
  },
  newButton(opts) {
    return this.newEl("button", {
      onready: function () {
        window._json2html.setupListeners(this);
      },
      ...opts,
    });
  },
  newInput(opts) {
    return this.newEl("input", {
      onready: function () {
        window._json2html.setupListeners(this);
      },
      ...opts,
    });
  },
};
/* helper */

window._windowManager = {
  _window: [],
  _zIndex: 99,
  getWindow(id) {
    let win = this._window.filter((w) => w.id == id);
    return win[0] || false;
  },
  getWindowByUUID(uuid) {
    let win = this._window.filter((w) => w.uuid == uuid);
    return win[0] || false;
  },
  getWindowIndexByUUID(uuid) {
    let index = null;
    this._window.map((w, id) => {
      if (w.uuid == uuid) index = id;
    });
    return index;
  },
  removeWindow(uuid) {
    let index = this.getWindowIndexByUUID(uuid);
    if (index != null) this._window.splice(index, 1);
  },
  /*
        Remove DOM element and reference from _window
    */
  closeWindow(uuid) {
    let _window = this.getWindowByUUID(uuid);
    _window.el.remove();
    this.removeWindow(uuid);
  },
  newWindow(opts = {}) {
    let win = {
      id: opts.id || null,
      uuid: this.UUID(),
      title: opts.title || "window",
      content: opts.content || [],
      onready: opts.onready || function () {},
      onremove: opts.onremove || function () {},
    };
    this._window.push(win);
    $("#DOM").json2html({}, this.winTemplate(win));
    /*
        Setup sizes
    */
    if (opts.size) {
      if (opts.size.maxwidth) win.el.style["max-width"] = opts.size.maxwidth;
      if (opts.size.maxheight) win.el.style["max-height"] = opts.size.maxheight;
      win.el.style.width = opts.size.width;
      win.el.style.height = opts.size.height;
    }
    /*
        Setup position
    */
    if (opts.pos) {
      win.el.style.left = opts.pos.left;
      win.el.style.top = opts.pos.top;
    }
    return win;
  },
  reorderWin(uuid = 0) {
    let tmp = this.getWindowByUUID(uuid);
    if (tmp) {
      this.removeWindow(uuid);
      this._window.push(tmp);
    }
    this._window.forEach((win, id) => {
      win.el.style.zIndex = window._windowManager._zIndex + id;
    });
    // var tmp = array[indexA];
    // array[indexA] = array[indexB];
    // array[indexB] = tmp;
  },
  winTemplate: (win) => {
    return {
      "<>": "div",
      id: win.id,
      "data-uuid": win.uuid,
      class: "is-fixed window has-background-dark",
      onready: function () {
        let _window = window._windowManager.getWindowByUUID(win.uuid);
        let index = window._windowManager.getWindowIndexByUUID(win.uuid);
        _window.el = this[0];
        $(this).on("mousedown", function () {
          window._windowManager.reorderWin(win.uuid);
          // console.log("Active: "+win.uuid)
        });
        window._windowManager.dragElement(_window.el);
        window._windowManager.reorderWin();
        if (win.onready) win.onready(_window); //send reference of window back
      },
      html: [
        {
          "<>": "header",
          html: [
            {
              "<>": "span",
              class: "has-background-black has-text-white is-pulled-left",
              text: win.title,
            },
            {
              "<>": "div",
              class: "btns has-background-dark is-pulled-right",
              html: [
                {
                  "<>": "button",
                  class: "button is-danger is-radiusless is-small",
                  onclick: function () {
                    let _window = window._windowManager.getWindowByUUID(
                      win.uuid
                    );
                    if (win.onremove) win.onremove(_window);
                    window._windowManager.closeWindow(win.uuid);
                  },
                  text: "x",
                },
              ],
            },
          ],
        },
        { "<>": "div", class: "window-content", html: win.content },
      ],
    };
  },
  UUID: () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  },
  dragElement: (elmnt) => {
    var pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    if (elmnt.querySelector("header span")) {
      /* if present, the header is where you move the DIV from:*/
      elmnt.querySelector("header span").onmousedown = dragMouseDown;
    } else {
      /* otherwise, move the DIV from anywhere inside the DIV:*/
      elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.setAttribute("data-x", elmnt.offsetTop - pos2);
      elmnt.setAttribute("data-y", elmnt.offsetLeft - pos1);
      elmnt.style.top = elmnt.offsetTop - pos2 + "px";
      elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
    }

    function closeDragElement() {
      /* stop moving when mouse button is released:*/
      document.onmouseup = null;
      document.onmousemove = null;
    }
  },
};

const onLoad = async (fn) => {
  return new Promise((r) => {
    const loop = setInterval(() => {
      if (typeof eval.call(this, `${fn}`) === "function") {
        clearInterval(loop);
        r(true);
      }
    }, 100);
  });
};

window.onLoad = onLoad;
