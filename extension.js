var __defProp = Object.defineProperty
  , __defNormalProp = (e, t, n) => t in e ? __defProp(e, t, {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: n
}) : e[t] = n
  , __publicField = (e, t, n) => __defNormalProp(e, "symbol" != typeof t ? t + "" : t, n);
!function() {
    "use strict";
    var e, t, n, r;
    function s(e) {
        const t = Number(e);
        return t >= 10 ? t.toString() : "0" + t.toString()
    }
    function i(e) {
        return void 0 === e ? e = new Date : e instanceof Date || (e = new Date(e)),
        e.getFullYear().toString() + "-" + s(e.getMonth() + 1) + "-" + s(e.getDate()) + "T" + s(e.getHours()) + ":" + s(e.getMinutes()) + ":" + s(e.getSeconds())
    }
    function a() {
        const e = new Uint8Array(16);
        self.crypto.getRandomValues(e),
        e[6] = 15 & e[6] | 64,
        e[8] = 63 & e[8] | 128;
        return [e.subarray(0, 4), e.subarray(4, 6), e.subarray(6, 8), e.subarray(8, 10), e.subarray(10, 16)].map((e => Array.from(e).map((e => e.toString(16).padStart(2, "0"))).join(""))).join("-")
    }
    function o(e, t) {
        return t.split(".").reduce(( (e, t) => null == e ? void 0 : e[t]), e)
    }
    function u(e) {
        try {
            const t = e.split(".")[1];
            if (!t)
                return null;
            const n = t.replace(/-/g, "+").replace(/_/g, "/")
              , r = decodeURIComponent(atob(n).split("").map((e => "%" + ("00" + e.charCodeAt(0).toString(16)).slice(-2))).join(""));
            return JSON.parse(r)
        } catch (t) {
            return null
        }
    }
    self.isServiceWorker = !0,
    self.context = "service worker";
    const l = ({type: e, queueKey: t=e}) => t
      , c = {
        version: "2.18.5",
        environment: "production",
        apiUrl: "https://api.momentumdash.com/",
        platform: "chrome",
        partnerId: 0
    };
    async function h({method: e, url: t, data: n, headers: r}) {
        const s = await fetch(t, {
            method: e,
            headers: r,
            body: "Object" === (null == n ? void 0 : n.constructor.name) ? JSON.stringify(n) : n
        }).catch(( () => ({
            statusText: "No response from the server"
        })))
          , {status: i, headers: a, statusText: o} = s
          , u = {
            status: i,
            headers: (null == a ? void 0 : a.entries) && Object.fromEntries(a) || {},
            statusText: o
        };
        if (s.ok) {
            const e = await s.text();
            return e && (u.data = JSON.parse(e)),
            u
        }
        {
            let r = "%c Request Error: " + (i || "");
            return o && (r += (i ? " : " : "") + o),
            console.groupCollapsed(r, "color: #ff0505"),
            console.log("Request:", {
                method: e,
                url: t,
                data: n
            }),
            console.log("Response:", s),
            console.groupEnd(),
            u
        }
    }
    function d(e) {
        return e >= 200 && e < 300
    }
    const f = "store"
      , p = "_key"
      , m = "_value";
    function y(e) {
        return void 0 === e || "string" == typeof e || "object" == typeof (t = e) && null !== t && p in t && m in t;
        var t
    }
    class g {
        constructor(e, t) {
            this.name = "keyValueDb:" + e,
            this.version = 10 * t,
            this.database = null
        }
        get db() {
            return this.database ? Promise.resolve(this.database) : this.open().then((e => this.database = e))
        }
        open() {
            return new Promise(( (e, t) => {
                const n = indexedDB.open(this.name, this.version);
                n.onerror = () => t(n.error),
                n.onupgradeneeded = () => {
                    n.result.createObjectStore(f, {
                        keyPath: p
                    })
                }
                ,
                n.onsuccess = () => {
                    const t = n.result;
                    t.onversionchange = () => {
                        t.close(),
                        this.database = null
                    }
                    ,
                    e(t)
                }
            }
            ))
        }
        async bulkPatch(e) {
            return t = await (async (e, t) => await Promise.all(e.map((async e => await t(e)))))((n = e,
            Object.entries(n)), (async ([e,t]) => {
                if (!t)
                    throw new Error("");
                return [e, await this.patch(e, t)]
            }
            )),
            Object.fromEntries(t);
            var t, n
        }
        async patch(e, t) {
            const n = await this.get(e);
            if ("object" != typeof n)
                throw new Error(`KeyValueDb:${this.name} Error: patch called on ${typeof n} value. Patch may only be called on objects or empty rows. Key: ${e}, Existing Value: ${String(n)}`);
            const r = Object.assign({}, n || {}, t)
              , s = {
                [p]: e,
                [m]: r
            };
            return await this.transaction("readwrite", (e => e.put(s))),
            {
                newValue: r,
                previousValue: n
            }
        }
        set(e, t) {
            const n = {
                [p]: e,
                [m]: t
            };
            return this.transaction("readwrite", (e => e.put(n)))
        }
        delete(e) {
            return this.transaction("readwrite", (t => t.delete(e)))
        }
        async get(e) {
            const t = await this.transaction("readonly", (t => t.get(e)));
            return t ? t[m] : null
        }
        async transaction(e, t, n={
            retries: 3
        }) {
            let r = 0;
            return new Promise(( (s, i) => {
                const a = async () => {
                    try {
                        const n = (await this.db).transaction([f], e);
                        n.onerror = () => i(r.error);
                        const r = t(n.objectStore(f));
                        r.onsuccess = () => {
                            const e = r.result;
                            if (!y(e))
                                throw new Error(`Transaction result does not match schema (does not contain a property matching ${p})`);
                            s(e)
                        }
                    } catch (o) {
                        if (++r > n.retries)
                            return void i(o);
                        (await this.db).close(),
                        this.database = null,
                        a()
                    }
                }
                ;
                a()
            }
            ))
        }
    }
    const v = new g("misc",1);
    let b = new class {
        constructor(e) {
            this.endpoint = e,
            this.config = null,
            this.pendingRequest = null
        }
        async getConfig() {
            return this.config || (this.pendingRequest ? await this.pendingRequest : (this.pendingRequest = this.fetchWithLocalFallback(),
            this.config = await this.pendingRequest,
            this.config && await v.set(this.endpoint, this.config))),
            this.config
        }
        fetchWithLocalFallback() {
            return h({
                method: "GET",
                data: void 0,
                url: "https://api.momentumdash.com/" + this.endpoint,
                headers: {
                    "X-Momentum-Version": c.version
                }
            }).then(( ({data: e}) => {
                if (!e)
                    throw "Request for config from API failed";
                return e
            }
            )).catch((e => (console.error(e),
            v.get(this.endpoint))))
        }
    }
    ("config");
    async function w(e) {
        const t = await b.getConfig();
        return t ? e ? o(t, e) : t : {}
    }
    const _ = c.version
      , k = c.environment
      , x = "extension"
      , E = new URL(`https://browser-http-intake.logs.datadoghq.com/v1/input/pub18ef9128dd80db1a80dfc3f9180b55b5?ddsource=browser&ddtags=${encodeURIComponent(`env:${k},service:${x},version:${_}`)}`).toString();
    class S {
        constructor(e, t=1e-5) {
            this.name = e,
            this.defaultSampleRate = t,
            this.sampleRate = null
        }
        warn(e, t) {
            return this._log(e, t, "warn")
        }
        error(e, t) {
            return this._log(e, t, "error")
        }
        info(e, t) {
            return this._log(e, t, "info")
        }
        async _log(...e) {
            if (!(await this._isEligibleForSubmission()))
                return;
            const [t,n,r] = this._parseArgs(e)
              , s = {
                status: r,
                date: Date.now(),
                service: x,
                message: t,
                _logger: this.name,
                ...n
            };
            this.tabId && (s.tabId = this.tabId),
            await h({
                method: "POST",
                url: E,
                data: s
            })
        }
        _convertUndefinedPropertiesToStrings(e) {
            const t = {};
            for (const [n,r] of Object.entries(e))
                t[n] = void 0 === r ? "<undefined>" : r;
            return t
        }
        _parseArgs(e) {
            let[t,n,r] = e;
            if (n || "object" != typeof t || (n = t,
            t = n.message),
            n instanceof ErrorEvent && (n = n.error),
            n instanceof Error) {
                const {name: e, stack: t} = n;
                n = {
                    name: e,
                    errorMessage: n.message,
                    stack: t
                }
            } else
                "string" == typeof n ? (t = `${t}: ${n}`,
                n = {}) : "string" == typeof t && (null == n ? void 0 : n.message) && (n.message = `${t}: ${n.message}`);
            return n && (n = this._convertUndefinedPropertiesToStrings(n)),
            [t, n, r]
        }
        async _isEligibleForSubmission() {
            return null === this.sampleRate && (this.sampleRate = await this._getSampleRate()),
            Math.random() <= this.sampleRate
        }
        async _getSampleRate() {
            const {datadogLoggingSamplingRate: e} = await w();
            return e ? this.name.split(".").reduce(( (t, n, r, s) => {
                const i = s.slice(0, r + 1).join(".");
                return i in e ? e[i] : t
            }
            ), this.defaultSampleRate) : this.defaultSampleRate
        }
    }
    const q = new S("serviceWorker",.01);
    function T(e, t) {
        const n = {
            type: t[0]
        };
        switch (e) {
        case "get":
            return {
                ...n,
                idType: t[1].id,
                env: O(t[1].env)
            };
        case "create":
        case "update":
            return {
                ...n,
                idType: P(t[1]),
                dataTypes: I(t[2]),
                env: O(t[3].env)
            };
        case "delete":
            return {
                ...n,
                idType: P(t[1]),
                env: O(t[2].env)
            };
        case "migrate":
            return {
                ...n,
                env: O(t[1].env)
            }
        }
    }
    function I(e) {
        const t = P(e);
        if ("object" !== t)
            return t;
        const n = {};
        return Object.entries(e).forEach(( ([e,t]) => n[e] = P(t))),
        n
    }
    function P(e) {
        return Array.isArray(e) ? "array" : null === e ? "null" : typeof e
    }
    function C({message: e, error: t, queueEntry: n, additionalData: r={}, logger: s}) {
        A({
            message: e,
            error: t,
            additionalData: {
                ...R(n),
                ...r
            },
            logger: s
        })
    }
    function R({type: e, method: t, id: n, env: r}) {
        return {
            type: String(e),
            method: String(t),
            cid: String(n),
            env: O(r)
        }
    }
    function A({message: e, error: t, additionalData: n={}, logger: r=q, level: s="error"}) {
        let i = {
            ...K(t, e),
            ...n
        };
        r[s](e, i),
        console["info" === s ? "log" : s].apply(null, [e, t, i].filter((e => e || "object" == typeof e && !Object.keys(e).length)))
    }
    function O({token: e, clientUuid: t, tabId: n}) {
        var r;
        return {
            clientUuid: String(t),
            userUuid: e ? (null == (r = u(e)) ? void 0 : r.user_guid) || "Parse failed" : "No token",
            tabId: String(n)
        }
    }
    function K(e, t) {
        const n = "object" === P(e)
          , r = n ? e.message : e;
        return {
            ...n ? {
                message: e.message,
                stack: e.stack,
                errorName: e.name
            } : {
                message: e
            },
            ...t ? {
                message: t,
                errorMessage: r
            } : {}
        }
    }
    class D {
        constructor(e) {
            this.handlers = e
        }
        async sendToAllTabs() {}
        _handleResponseTimeout(e, t) {
            return setTimeout(( () => {
                this._handleError(e, t, `Message to ${self.context} timed out. Reason: message received but handler did not resolve. Handler: ${e.handler}`, "warn")
            }
            ), e.timeout || 1e4)
        }
        async _handleError(e, t, n, r) {
            const {handler: s, args: i, msgId: a} = e;
            await async function({error: e, handler: t, args: n, level: r}) {
                let s;
                if ("DatabaseClosedError" === e.name && navigator.storage.estimate) {
                    s = await navigator.storage.estimate();
                    const e = await caches.keys();
                    await Promise.allSettled(e.map((e => caches.delete(e))));
                    const t = await navigator.storage.estimate();
                    new S("serviceWorker.databaseClosedErrorCacheClear",1).info({
                        cacheClearInfo: {
                            beforeClear: s,
                            afterClear: t,
                            cacheNames: e
                        }
                    })
                }
                A({
                    error: e,
                    additionalData: {
                        args: T(t, n),
                        storageEstimate: s,
                        handler: t
                    },
                    level: r
                })
            }({
                error: n,
                handler: s,
                args: i,
                level: r
            }),
            null == t || t({
                msgId: a,
                error: n
            })
        }
        async _onMessage(e, t) {
            const {msgId: n, handler: r, args: s, tabId: i} = e;
            if (s && s.push(i),
            "function" == typeof this.handlers[r]) {
                const i = this._handleResponseTimeout(e, t);
                return Promise.resolve(this.handlers[r].apply(this.sync, s)).then((e => {
                    clearTimeout(i),
                    null == t || t({
                        msgId: n,
                        response: e
                    })
                }
                ), (n => {
                    clearTimeout(i),
                    this._handleError(e, t, n)
                }
                ))
            }
            return await this._handleError(e, t, `Message to ${self.context} rejected: No method was found in handlers.js with the name: ${r}`, "warn"),
            Promise.resolve()
        }
    }
    class j extends D {
        constructor(e) {
            super(e),
            self.addEventListener("message", (e => {
                let t = e.source instanceof ServiceWorker ? null : e.source.postMessage.bind(e.source);
                e.waitUntil(this._onMessage(e.data, t))
            }
            ))
        }
        async sendToAllTabs(e, t) {
            await self.clients.claim();
            (await self.clients.matchAll()).forEach((n => {
                e.exemptedTabId = t,
                n.postMessage(e)
            }
            ))
        }
    }
    const M = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : global
      , F = Object.keys
      , B = Array.isArray;
    function N(e, t) {
        return "object" != typeof t || F(t).forEach((function(n) {
            e[n] = t[n]
        }
        )),
        e
    }
    "undefined" == typeof Promise || M.Promise || (M.Promise = Promise);
    const U = Object.getPrototypeOf
      , L = {}.hasOwnProperty;
    function $(e, t) {
        return L.call(e, t)
    }
    function W(e, t) {
        "function" == typeof t && (t = t(U(e))),
        ("undefined" == typeof Reflect ? F : Reflect.ownKeys)(t).forEach((n => {
            Q(e, n, t[n])
        }
        ))
    }
    const V = Object.defineProperty;
    function Q(e, t, n, r) {
        V(e, t, N(n && $(n, "get") && "function" == typeof n.get ? {
            get: n.get,
            set: n.set,
            configurable: !0
        } : {
            value: n,
            configurable: !0,
            writable: !0
        }, r))
    }
    function z(e) {
        return {
            from: function(t) {
                return e.prototype = Object.create(t.prototype),
                Q(e.prototype, "constructor", e),
                {
                    extend: W.bind(null, e.prototype)
                }
            }
        }
    }
    const X = Object.getOwnPropertyDescriptor;
    function Y(e, t) {
        let n;
        return X(e, t) || (n = U(e)) && Y(n, t)
    }
    const H = [].slice;
    function G(e, t, n) {
        return H.call(e, t, n)
    }
    function J(e, t) {
        return t(e)
    }
    function Z(e) {
        if (!e)
            throw new Error("Assertion Failed")
    }
    function ee(e) {
        M.setImmediate ? setImmediate(e) : setTimeout(e, 0)
    }
    function te(e, t) {
        return e.reduce(( (e, n, r) => {
            var s = t(n, r);
            return s && (e[s[0]] = s[1]),
            e
        }
        ), {})
    }
    function ne(e, t) {
        if ("string" == typeof t && $(e, t))
            return e[t];
        if (!t)
            return e;
        if ("string" != typeof t) {
            for (var n = [], r = 0, s = t.length; r < s; ++r) {
                var i = ne(e, t[r]);
                n.push(i)
            }
            return n
        }
        var a = t.indexOf(".");
        if (-1 !== a) {
            var o = e[t.substr(0, a)];
            return null == o ? void 0 : ne(o, t.substr(a + 1))
        }
    }
    function re(e, t, n) {
        if (e && void 0 !== t && (!("isFrozen"in Object) || !Object.isFrozen(e)))
            if ("string" != typeof t && "length"in t) {
                Z("string" != typeof n && "length"in n);
                for (var r = 0, s = t.length; r < s; ++r)
                    re(e, t[r], n[r])
            } else {
                var i = t.indexOf(".");
                if (-1 !== i) {
                    var a = t.substr(0, i)
                      , o = t.substr(i + 1);
                    if ("" === o)
                        void 0 === n ? B(e) && !isNaN(parseInt(a)) ? e.splice(a, 1) : delete e[a] : e[a] = n;
                    else {
                        var u = e[a];
                        u && $(e, a) || (u = e[a] = {}),
                        re(u, o, n)
                    }
                } else
                    void 0 === n ? B(e) && !isNaN(parseInt(t)) ? e.splice(t, 1) : delete e[t] : e[t] = n
            }
    }
    function se(e) {
        var t = {};
        for (var n in e)
            $(e, n) && (t[n] = e[n]);
        return t
    }
    const ie = [].concat;
    function ae(e) {
        return ie.apply([], e)
    }
    const oe = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(ae([8, 16, 32, 64].map((e => ["Int", "Uint", "Float"].map((t => t + e + "Array")))))).filter((e => M[e]))
      , ue = oe.map((e => M[e]));
    te(oe, (e => [e, !0]));
    let le = null;
    function ce(e) {
        le = "undefined" != typeof WeakMap && new WeakMap;
        const t = he(e);
        return le = null,
        t
    }
    function he(e) {
        if (!e || "object" != typeof e)
            return e;
        let t = le && le.get(e);
        if (t)
            return t;
        if (B(e)) {
            t = [],
            le && le.set(e, t);
            for (var n = 0, r = e.length; n < r; ++n)
                t.push(he(e[n]))
        } else if (ue.indexOf(e.constructor) >= 0)
            t = e;
        else {
            const n = U(e);
            for (var s in t = n === Object.prototype ? {} : Object.create(n),
            le && le.set(e, t),
            e)
                $(e, s) && (t[s] = he(e[s]))
        }
        return t
    }
    const {toString: de} = {};
    function fe(e) {
        return de.call(e).slice(8, -1)
    }
    const pe = "undefined" != typeof Symbol ? Symbol.iterator : "@@iterator"
      , me = "symbol" == typeof pe ? function(e) {
        var t;
        return null != e && (t = e[pe]) && t.apply(e)
    }
    : function() {
        return null
    }
      , ye = {};
    function ge(e) {
        var t, n, r, s;
        if (1 === arguments.length) {
            if (B(e))
                return e.slice();
            if (this === ye && "string" == typeof e)
                return [e];
            if (s = me(e)) {
                for (n = []; !(r = s.next()).done; )
                    n.push(r.value);
                return n
            }
            if (null == e)
                return [e];
            if ("number" == typeof (t = e.length)) {
                for (n = new Array(t); t--; )
                    n[t] = e[t];
                return n
            }
            return [e]
        }
        for (t = arguments.length,
        n = new Array(t); t--; )
            n[t] = arguments[t];
        return n
    }
    const ve = "undefined" != typeof Symbol ? e => "AsyncFunction" === e[Symbol.toStringTag] : () => !1;
    var be = "undefined" != typeof location && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
    function we(e, t) {
        be = e,
        _e = t
    }
    var _e = () => !0;
    const ke = !new Error("").stack;
    function xe() {
        if (ke)
            try {
                throw xe.arguments,
                new Error
            } catch (e) {
                return e
            }
        return new Error
    }
    function Ee(e, t) {
        var n = e.stack;
        return n ? (t = t || 0,
        0 === n.indexOf(e.name) && (t += (e.name + e.message).split("\n").length),
        n.split("\n").slice(t).filter(_e).map((e => "\n" + e)).join("")) : ""
    }
    var Se = ["Unknown", "Constraint", "Data", "TransactionInactive", "ReadOnly", "Version", "NotFound", "InvalidState", "InvalidAccess", "Abort", "Timeout", "QuotaExceeded", "Syntax", "DataClone"]
      , qe = ["Modify", "Bulk", "OpenFailed", "VersionChange", "Schema", "Upgrade", "InvalidTable", "MissingAPI", "NoSuchDatabase", "InvalidArgument", "SubTransaction", "Unsupported", "Internal", "DatabaseClosed", "PrematureCommit", "ForeignAwait"].concat(Se)
      , Te = {
        VersionChanged: "Database version changed by other database connection",
        DatabaseClosed: "Database has been closed",
        Abort: "Transaction aborted",
        TransactionInactive: "Transaction has already completed or failed",
        MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb"
    };
    function Ie(e, t) {
        this._e = xe(),
        this.name = e,
        this.message = t
    }
    function Pe(e, t) {
        return e + ". Errors: " + Object.keys(t).map((e => t[e].toString())).filter(( (e, t, n) => n.indexOf(e) === t)).join("\n")
    }
    function Ce(e, t, n, r) {
        this._e = xe(),
        this.failures = t,
        this.failedKeys = r,
        this.successCount = n,
        this.message = Pe(e, t)
    }
    function Re(e, t) {
        this._e = xe(),
        this.name = "BulkError",
        this.failures = Object.keys(t).map((e => t[e])),
        this.failuresByPos = t,
        this.message = Pe(e, t)
    }
    z(Ie).from(Error).extend({
        stack: {
            get: function() {
                return this._stack || (this._stack = this.name + ": " + this.message + Ee(this._e, 2))
            }
        },
        toString: function() {
            return this.name + ": " + this.message
        }
    }),
    z(Ce).from(Ie),
    z(Re).from(Ie);
    var Ae = qe.reduce(( (e, t) => (e[t] = t + "Error",
    e)), {});
    const Oe = Ie;
    var Ke = qe.reduce(( (e, t) => {
        var n = t + "Error";
        function r(e, r) {
            this._e = xe(),
            this.name = n,
            e ? "string" == typeof e ? (this.message = `${e}${r ? "\n " + r : ""}`,
            this.inner = r || null) : "object" == typeof e && (this.message = `${e.name} ${e.message}`,
            this.inner = e) : (this.message = Te[t] || n,
            this.inner = null)
        }
        return z(r).from(Oe),
        e[t] = r,
        e
    }
    ), {});
    Ke.Syntax = SyntaxError,
    Ke.Type = TypeError,
    Ke.Range = RangeError;
    var De = Se.reduce(( (e, t) => (e[t + "Error"] = Ke[t],
    e)), {})
      , je = qe.reduce(( (e, t) => (-1 === ["Syntax", "Type", "Range"].indexOf(t) && (e[t + "Error"] = Ke[t]),
    e)), {});
    function Me() {}
    function Fe(e) {
        return e
    }
    function Be(e, t) {
        return null == e || e === Fe ? t : function(n) {
            return t(e(n))
        }
    }
    function Ne(e, t) {
        return function() {
            e.apply(this, arguments),
            t.apply(this, arguments)
        }
    }
    function Ue(e, t) {
        return e === Me ? t : function() {
            var n = e.apply(this, arguments);
            void 0 !== n && (arguments[0] = n);
            var r = this.onsuccess
              , s = this.onerror;
            this.onsuccess = null,
            this.onerror = null;
            var i = t.apply(this, arguments);
            return r && (this.onsuccess = this.onsuccess ? Ne(r, this.onsuccess) : r),
            s && (this.onerror = this.onerror ? Ne(s, this.onerror) : s),
            void 0 !== i ? i : n
        }
    }
    function Le(e, t) {
        return e === Me ? t : function() {
            e.apply(this, arguments);
            var n = this.onsuccess
              , r = this.onerror;
            this.onsuccess = this.onerror = null,
            t.apply(this, arguments),
            n && (this.onsuccess = this.onsuccess ? Ne(n, this.onsuccess) : n),
            r && (this.onerror = this.onerror ? Ne(r, this.onerror) : r)
        }
    }
    function $e(e, t) {
        return e === Me ? t : function(n) {
            var r = e.apply(this, arguments);
            N(n, r);
            var s = this.onsuccess
              , i = this.onerror;
            this.onsuccess = null,
            this.onerror = null;
            var a = t.apply(this, arguments);
            return s && (this.onsuccess = this.onsuccess ? Ne(s, this.onsuccess) : s),
            i && (this.onerror = this.onerror ? Ne(i, this.onerror) : i),
            void 0 === r ? void 0 === a ? void 0 : a : N(r, a)
        }
    }
    function We(e, t) {
        return e === Me ? t : function() {
            return !1 !== t.apply(this, arguments) && e.apply(this, arguments)
        }
    }
    function Ve(e, t) {
        return e === Me ? t : function() {
            var n = e.apply(this, arguments);
            if (n && "function" == typeof n.then) {
                for (var r = this, s = arguments.length, i = new Array(s); s--; )
                    i[s] = arguments[s];
                return n.then((function() {
                    return t.apply(r, i)
                }
                ))
            }
            return t.apply(this, arguments)
        }
    }
    je.ModifyError = Ce,
    je.DexieError = Ie,
    je.BulkError = Re;
    var Qe = {};
    const ze = 100
      , [Xe,Ye,He] = "undefined" == typeof Promise ? [] : ( () => {
        let e = Promise.resolve();
        if ("undefined" == typeof crypto || !crypto.subtle)
            return [e, U(e), e];
        const t = crypto.subtle.digest("SHA-512", new Uint8Array([0]));
        return [t, U(t), e]
    }
    )()
      , Ge = Ye && Ye.then
      , Je = Xe && Xe.constructor
      , Ze = !!He;
    var et = !1
      , tt = He ? () => {
        He.then(Et)
    }
    : M.setImmediate ? setImmediate.bind(null, Et) : M.MutationObserver ? () => {
        var e = document.createElement("div");
        new MutationObserver(( () => {
            Et(),
            e = null
        }
        )).observe(e, {
            attributes: !0
        }),
        e.setAttribute("i", "1")
    }
    : () => {
        setTimeout(Et, 0)
    }
      , nt = function(e, t) {
        ht.push([e, t]),
        st && (tt(),
        st = !1)
    }
      , rt = !0
      , st = !0
      , it = []
      , at = []
      , ot = null
      , ut = Fe
      , lt = {
        id: "global",
        global: !0,
        ref: 0,
        unhandleds: [],
        onunhandled: Yt,
        pgp: !1,
        env: {},
        finalize: function() {
            this.unhandleds.forEach((e => {
                try {
                    Yt(e[0], e[1])
                } catch (t) {}
            }
            ))
        }
    }
      , ct = lt
      , ht = []
      , dt = 0
      , ft = [];
    function pt(e) {
        if ("object" != typeof this)
            throw new TypeError("Promises must be constructed via new");
        this._listeners = [],
        this.onuncatched = Me,
        this._lib = !1;
        var t = this._PSD = ct;
        if (be && (this._stackHolder = xe(),
        this._prev = null,
        this._numPrev = 0),
        "function" != typeof e) {
            if (e !== Qe)
                throw new TypeError("Not a function");
            return this._state = arguments[1],
            this._value = arguments[2],
            void (!1 === this._state && vt(this, this._value))
        }
        this._state = null,
        this._value = null,
        ++t.ref,
        gt(this, e)
    }
    const mt = {
        get: function() {
            var e = ct
              , t = Kt;
            function n(n, r) {
                var s = !e.global && (e !== ct || t !== Kt);
                const i = s && !Ft();
                var a = new pt(( (t, a) => {
                    wt(this, new yt(Qt(n, e, s, i),Qt(r, e, s, i),t,a,e))
                }
                ));
                return be && xt(a, this),
                a
            }
            return n.prototype = Qe,
            n
        },
        set: function(e) {
            Q(this, "then", e && e.prototype === Qe ? mt : {
                get: function() {
                    return e
                },
                set: mt.set
            })
        }
    };
    function yt(e, t, n, r, s) {
        this.onFulfilled = "function" == typeof e ? e : null,
        this.onRejected = "function" == typeof t ? t : null,
        this.resolve = n,
        this.reject = r,
        this.psd = s
    }
    function gt(e, t) {
        try {
            t((t => {
                if (null === e._state) {
                    if (t === e)
                        throw new TypeError("A promise cannot be resolved with itself.");
                    var n = e._lib && St();
                    t && "function" == typeof t.then ? gt(e, ( (e, n) => {
                        t instanceof pt ? t._then(e, n) : t.then(e, n)
                    }
                    )) : (e._state = !0,
                    e._value = t,
                    bt(e)),
                    n && qt()
                }
            }
            ), vt.bind(null, e))
        } catch (n) {
            vt(e, n)
        }
    }
    function vt(e, t) {
        if (at.push(t),
        null === e._state) {
            var n = e._lib && St();
            t = ut(t),
            e._state = !1,
            e._value = t,
            be && null !== t && "object" == typeof t && !t._promise && function(n, r, s) {
                try {
                    ( () => {
                        var n = Y(t, "stack");
                        t._promise = e,
                        Q(t, "stack", {
                            get: () => et ? n && (n.get ? n.get.apply(t) : n.value) : e.stack
                        })
                    }
                    ).apply(null, void 0)
                } catch (i) {}
            }(),
            r = e,
            it.some((e => e._value === r._value)) || it.push(r),
            bt(e),
            n && qt()
        }
        var r
    }
    function bt(e) {
        var t = e._listeners;
        e._listeners = [];
        for (var n = 0, r = t.length; n < r; ++n)
            wt(e, t[n]);
        var s = e._PSD;
        --s.ref || s.finalize(),
        0 === dt && (++dt,
        nt(( () => {
            0 == --dt && Tt()
        }
        ), []))
    }
    function wt(e, t) {
        if (null !== e._state) {
            var n = e._state ? t.onFulfilled : t.onRejected;
            if (null === n)
                return (e._state ? t.resolve : t.reject)(e._value);
            ++t.psd.ref,
            ++dt,
            nt(_t, [n, e, t])
        } else
            e._listeners.push(t)
    }
    function _t(e, t, n) {
        try {
            ot = t;
            var r, s = t._value;
            t._state ? r = e(s) : (at.length && (at = []),
            r = e(s),
            -1 === at.indexOf(s) && function(e) {
                for (var t = it.length; t; )
                    if (it[--t]._value === e._value)
                        return void it.splice(t, 1)
            }(t)),
            n.resolve(r)
        } catch (i) {
            n.reject(i)
        } finally {
            ot = null,
            0 == --dt && Tt(),
            --n.psd.ref || n.psd.finalize()
        }
    }
    function kt(e, t, n) {
        if (t.length === n)
            return t;
        var r = "";
        if (!1 === e._state) {
            var s, i, a = e._value;
            null != a ? (s = a.name || "Error",
            i = a.message || a,
            r = Ee(a, 0)) : (s = a,
            i = ""),
            t.push(s + (i ? ": " + i : "") + r)
        }
        return be && ((r = Ee(e._stackHolder, 2)) && -1 === t.indexOf(r) && t.push(r),
        e._prev && kt(e._prev, t, n)),
        t
    }
    function xt(e, t) {
        var n = t ? t._numPrev + 1 : 0;
        n < 100 && (e._prev = t,
        e._numPrev = n)
    }
    function Et() {
        St() && qt()
    }
    function St() {
        var e = rt;
        return rt = !1,
        st = !1,
        e
    }
    function qt() {
        var e, t, n;
        do {
            for (; ht.length > 0; )
                for (e = ht,
                ht = [],
                n = e.length,
                t = 0; t < n; ++t) {
                    var r = e[t];
                    r[0].apply(null, r[1])
                }
        } while (ht.length > 0);
        rt = !0,
        st = !0
    }
    function Tt() {
        var e = it;
        it = [],
        e.forEach((e => {
            e._PSD.onunhandled.call(null, e._value, e)
        }
        ));
        for (var t = ft.slice(0), n = t.length; n; )
            t[--n]()
    }
    function It(e) {
        return new pt(Qe,!1,e)
    }
    function Pt(e, t) {
        var n = ct;
        return function() {
            var r = St()
              , s = ct;
            try {
                return Lt(n, !0),
                e.apply(this, arguments)
            } catch (i) {
                t && t(i)
            } finally {
                Lt(s, !1),
                r && qt()
            }
        }
    }
    W(pt.prototype, {
        then: mt,
        _then: function(e, t) {
            wt(this, new yt(null,null,e,t,ct))
        },
        catch: function(e) {
            if (1 === arguments.length)
                return this.then(null, e);
            var t = arguments[0]
              , n = arguments[1];
            return "function" == typeof t ? this.then(null, (e => e instanceof t ? n(e) : It(e))) : this.then(null, (e => e && e.name === t ? n(e) : It(e)))
        },
        finally: function(e) {
            return this.then((t => (e(),
            t)), (t => (e(),
            It(t))))
        },
        stack: {
            get: function() {
                if (this._stack)
                    return this._stack;
                try {
                    et = !0;
                    var e = kt(this, [], 20).join("\nFrom previous: ");
                    return null !== this._state && (this._stack = e),
                    e
                } finally {
                    et = !1
                }
            }
        },
        timeout: function(e, t) {
            return e < 1 / 0 ? new pt(( (n, r) => {
                var s = setTimeout(( () => r(new Ke.Timeout(t))), e);
                this.then(n, r).finally(clearTimeout.bind(null, s))
            }
            )) : this
        }
    }),
    "undefined" != typeof Symbol && Symbol.toStringTag && Q(pt.prototype, Symbol.toStringTag, "Dexie.Promise"),
    lt.env = $t(),
    W(pt, {
        all: function() {
            var e = ge.apply(null, arguments).map(Bt);
            return new pt((function(t, n) {
                0 === e.length && t([]);
                var r = e.length;
                e.forEach(( (s, i) => pt.resolve(s).then((n => {
                    e[i] = n,
                    --r || t(e)
                }
                ), n)))
            }
            ))
        },
        resolve: e => {
            if (e instanceof pt)
                return e;
            if (e && "function" == typeof e.then)
                return new pt(( (t, n) => {
                    e.then(t, n)
                }
                ));
            var t = new pt(Qe,!0,e);
            return xt(t, ot),
            t
        }
        ,
        reject: It,
        race: function() {
            var e = ge.apply(null, arguments).map(Bt);
            return new pt(( (t, n) => {
                e.map((e => pt.resolve(e).then(t, n)))
            }
            ))
        },
        PSD: {
            get: () => ct,
            set: e => ct = e
        },
        totalEchoes: {
            get: () => Kt
        },
        newPSD: jt,
        usePSD: Wt,
        scheduler: {
            get: () => nt,
            set: e => {
                nt = e
            }
        },
        rejectionMapper: {
            get: () => ut,
            set: e => {
                ut = e
            }
        },
        follow: (e, t) => new pt(( (n, r) => jt(( (t, n) => {
            var r = ct;
            r.unhandleds = [],
            r.onunhandled = n,
            r.finalize = Ne((function() {
                var e;
                e = () => {
                    0 === this.unhandleds.length ? t() : n(this.unhandleds[0])
                }
                ,
                ft.push((function t() {
                    e(),
                    ft.splice(ft.indexOf(t), 1)
                }
                )),
                ++dt,
                nt(( () => {
                    0 == --dt && Tt()
                }
                ), [])
            }
            ), r.finalize),
            e()
        }
        ), t, n, r)))
    }),
    Je && (Je.allSettled && Q(pt, "allSettled", (function() {
        const e = ge.apply(null, arguments).map(Bt);
        return new pt((t => {
            0 === e.length && t([]);
            let n = e.length;
            const r = new Array(n);
            e.forEach(( (e, s) => pt.resolve(e).then((e => r[s] = {
                status: "fulfilled",
                value: e
            }), (e => r[s] = {
                status: "rejected",
                reason: e
            })).then(( () => --n || t(r)))))
        }
        ))
    }
    )),
    Je.any && "undefined" != typeof AggregateError && Q(pt, "any", (function() {
        const e = ge.apply(null, arguments).map(Bt);
        return new pt(( (t, n) => {
            0 === e.length && n(new AggregateError([]));
            let r = e.length;
            const s = new Array(r);
            e.forEach(( (e, i) => pt.resolve(e).then((e => t(e)), (e => {
                s[i] = e,
                --r || n(new AggregateError(s))
            }
            ))))
        }
        ))
    }
    )));
    const Ct = {
        awaits: 0,
        echoes: 0,
        id: 0
    };
    var Rt = 0
      , At = []
      , Ot = 0
      , Kt = 0
      , Dt = 0;
    function jt(e, t, n, r) {
        var s = ct
          , i = Object.create(s);
        i.parent = s,
        i.ref = 0,
        i.global = !1,
        i.id = ++Dt;
        var a = lt.env;
        i.env = Ze ? {
            Promise: pt,
            PromiseProp: {
                value: pt,
                configurable: !0,
                writable: !0
            },
            all: pt.all,
            race: pt.race,
            allSettled: pt.allSettled,
            any: pt.any,
            resolve: pt.resolve,
            reject: pt.reject,
            nthen: zt(a.nthen, i),
            gthen: zt(a.gthen, i)
        } : {},
        t && N(i, t),
        ++s.ref,
        i.finalize = function() {
            --this.parent.ref || this.parent.finalize()
        }
        ;
        var o = Wt(i, e, n, r);
        return 0 === i.ref && i.finalize(),
        o
    }
    function Mt() {
        return Ct.id || (Ct.id = ++Rt),
        ++Ct.awaits,
        Ct.echoes += ze,
        Ct.id
    }
    function Ft() {
        return !!Ct.awaits && (0 == --Ct.awaits && (Ct.id = 0),
        Ct.echoes = Ct.awaits * ze,
        !0)
    }
    function Bt(e) {
        return Ct.echoes && e && e.constructor === Je ? (Mt(),
        e.then((e => (Ft(),
        e)), (e => (Ft(),
        Ht(e))))) : e
    }
    function Nt(e) {
        ++Kt,
        Ct.echoes && 0 != --Ct.echoes || (Ct.echoes = Ct.id = 0),
        At.push(ct),
        Lt(e, !0)
    }
    function Ut() {
        var e = At[At.length - 1];
        At.pop(),
        Lt(e, !1)
    }
    function Lt(e, t) {
        var n = ct;
        if ((t ? !Ct.echoes || Ot++ && e === ct : !Ot || --Ot && e === ct) || Vt(t ? Nt.bind(null, e) : Ut),
        e !== ct && (ct = e,
        n === lt && (lt.env = $t()),
        Ze)) {
            var r = lt.env.Promise
              , s = e.env;
            Ye.then = s.nthen,
            r.prototype.then = s.gthen,
            (n.global || e.global) && (Object.defineProperty(M, "Promise", s.PromiseProp),
            r.all = s.all,
            r.race = s.race,
            r.resolve = s.resolve,
            r.reject = s.reject,
            s.allSettled && (r.allSettled = s.allSettled),
            s.any && (r.any = s.any))
        }
    }
    function $t() {
        var e = M.Promise;
        return Ze ? {
            Promise: e,
            PromiseProp: Object.getOwnPropertyDescriptor(M, "Promise"),
            all: e.all,
            race: e.race,
            allSettled: e.allSettled,
            any: e.any,
            resolve: e.resolve,
            reject: e.reject,
            nthen: Ye.then,
            gthen: e.prototype.then
        } : {}
    }
    function Wt(e, t, n, r, s) {
        var i = ct;
        try {
            return Lt(e, !0),
            t(n, r, s)
        } finally {
            Lt(i, !1)
        }
    }
    function Vt(e) {
        Ge.call(Xe, e)
    }
    function Qt(e, t, n, r) {
        return "function" != typeof e ? e : function() {
            var s = ct;
            n && Mt(),
            Lt(t, !0);
            try {
                return e.apply(this, arguments)
            } finally {
                Lt(s, !1),
                r && Vt(Ft)
            }
        }
    }
    function zt(e, t) {
        return function(n, r) {
            return e.call(this, Qt(n, t), Qt(r, t))
        }
    }
    -1 === ("" + Ge).indexOf("[native code]") && (Mt = Ft = Me);
    const Xt = "unhandledrejection";
    function Yt(e, t) {
        var n;
        try {
            n = t.onuncatched(e)
        } catch (i) {}
        if (!1 !== n)
            try {
                var r, s = {
                    promise: t,
                    reason: e
                };
                if (M.document && document.createEvent ? ((r = document.createEvent("Event")).initEvent(Xt, !0, !0),
                N(r, s)) : M.CustomEvent && N(r = new CustomEvent(Xt,{
                    detail: s
                }), s),
                r && M.dispatchEvent && (dispatchEvent(r),
                !M.PromiseRejectionEvent && M.onunhandledrejection))
                    try {
                        M.onunhandledrejection(r)
                    } catch (i) {}
                be && r && !r.defaultPrevented && console.warn(`Unhandled rejection: ${e.stack || e}`)
            } catch (i) {}
    }
    var Ht = pt.reject;
    function Gt(e, t, n, r) {
        if (e.idbdb && (e._state.openComplete || ct.letThrough || e._vip)) {
            var s = e._createTransaction(t, n, e._dbSchema);
            try {
                s.create(),
                e._state.PR1398_maxLoop = 3
            } catch (i) {
                return i.name === Ae.InvalidState && e.isOpen() && --e._state.PR1398_maxLoop > 0 ? (console.warn("Dexie: Need to reopen db"),
                e._close(),
                e.open().then(( () => Gt(e, t, n, r)))) : Ht(i)
            }
            return s._promise(t, ( (e, t) => jt(( () => (ct.trans = s,
            r(e, t, s)))))).then((e => s._completion.then(( () => e))))
        }
        if (e._state.openComplete)
            return Ht(new Ke.DatabaseClosed(e._state.dbOpenError));
        if (!e._state.isBeingOpened) {
            if (!e._options.autoOpen)
                return Ht(new Ke.DatabaseClosed);
            e.open().catch(Me)
        }
        return e._state.dbReadyPromise.then(( () => Gt(e, t, n, r)))
    }
    const Jt = "3.2.7"
      , Zt = String.fromCharCode(65535)
      , en = -1 / 0
      , tn = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>."
      , nn = "String expected."
      , rn = []
      , sn = "undefined" != typeof navigator && /(MSIE|Trident|Edge)/.test(navigator.userAgent)
      , an = sn
      , on = sn
      , un = e => !/(dexie\.js|dexie\.min\.js)/.test(e)
      , ln = "__dbnames"
      , cn = "readonly"
      , hn = "readwrite";
    function dn(e, t) {
        return e ? t ? function() {
            return e.apply(this, arguments) && t.apply(this, arguments)
        }
        : e : t
    }
    const fn = {
        type: 3,
        lower: -1 / 0,
        lowerOpen: !1,
        upper: [[]],
        upperOpen: !1
    };
    function pn(e) {
        return "string" != typeof e || /\./.test(e) ? e => e : t => (void 0 === t[e] && e in t && delete (t = ce(t))[e],
        t)
    }
    class mn {
        _trans(e, t, n) {
            const r = this._tx || ct.trans
              , s = this.name;
            function i(e, n, r) {
                if (!r.schema[s])
                    throw new Ke.NotFound("Table " + s + " not part of transaction");
                return t(r.idbtrans, r)
            }
            const a = St();
            try {
                return r && r.db === this.db ? r === ct.trans ? r._promise(e, i, n) : jt(( () => r._promise(e, i, n)), {
                    trans: r,
                    transless: ct.transless || ct
                }) : Gt(this.db, e, [this.name], i)
            } finally {
                a && qt()
            }
        }
        get(e, t) {
            return e && e.constructor === Object ? this.where(e).first(t) : this._trans("readonly", (t => this.core.get({
                trans: t,
                key: e
            }).then((e => this.hook.reading.fire(e))))).then(t)
        }
        where(e) {
            if ("string" == typeof e)
                return new this.db.WhereClause(this,e);
            if (B(e))
                return new this.db.WhereClause(this,`[${e.join("+")}]`);
            const t = F(e);
            if (1 === t.length)
                return this.where(t[0]).equals(e[t[0]]);
            const n = this.schema.indexes.concat(this.schema.primKey).filter((e => {
                if (e.compound && t.every((t => e.keyPath.indexOf(t) >= 0))) {
                    for (let n = 0; n < t.length; ++n)
                        if (-1 === t.indexOf(e.keyPath[n]))
                            return !1;
                    return !0
                }
                return !1
            }
            )).sort(( (e, t) => e.keyPath.length - t.keyPath.length))[0];
            if (n && this.db._maxKey !== Zt) {
                const r = n.keyPath.slice(0, t.length);
                return this.where(r).equals(r.map((t => e[t])))
            }
            !n && be && console.warn(`The query ${JSON.stringify(e)} on ${this.name} would benefit of a compound index [${t.join("+")}]`);
            const {idxByName: r} = this.schema
              , s = this.db._deps.indexedDB;
            function i(e, t) {
                try {
                    return 0 === s.cmp(e, t)
                } catch (n) {
                    return !1
                }
            }
            const [a,o] = t.reduce(( ([t,n], s) => {
                const a = r[s]
                  , o = e[s];
                return [t || a, t || !a ? dn(n, a && a.multi ? e => {
                    const t = ne(e, s);
                    return B(t) && t.some((e => i(o, e)))
                }
                : e => i(o, ne(e, s))) : n]
            }
            ), [null, null]);
            return a ? this.where(a.name).equals(e[a.keyPath]).filter(o) : n ? this.filter(o) : this.where(t).equals("")
        }
        filter(e) {
            return this.toCollection().and(e)
        }
        count(e) {
            return this.toCollection().count(e)
        }
        offset(e) {
            return this.toCollection().offset(e)
        }
        limit(e) {
            return this.toCollection().limit(e)
        }
        each(e) {
            return this.toCollection().each(e)
        }
        toArray(e) {
            return this.toCollection().toArray(e)
        }
        toCollection() {
            return new this.db.Collection(new this.db.WhereClause(this))
        }
        orderBy(e) {
            return new this.db.Collection(new this.db.WhereClause(this,B(e) ? `[${e.join("+")}]` : e))
        }
        reverse() {
            return this.toCollection().reverse()
        }
        mapToClass(e) {
            this.schema.mappedClass = e;
            const t = t => {
                if (!t)
                    return t;
                const n = Object.create(e.prototype);
                for (var r in t)
                    if ($(t, r))
                        try {
                            n[r] = t[r]
                        } catch (s) {}
                return n
            }
            ;
            return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook),
            this.schema.readHook = t,
            this.hook("reading", t),
            e
        }
        defineClass() {
            return this.mapToClass((function(e) {
                N(this, e)
            }
            ))
        }
        add(e, t) {
            const {auto: n, keyPath: r} = this.schema.primKey;
            let s = e;
            return r && n && (s = pn(r)(e)),
            this._trans("readwrite", (e => this.core.mutate({
                trans: e,
                type: "add",
                keys: null != t ? [t] : null,
                values: [s]
            }))).then((e => e.numFailures ? pt.reject(e.failures[0]) : e.lastResult)).then((t => {
                if (r)
                    try {
                        re(e, r, t)
                    } catch (n) {}
                return t
            }
            ))
        }
        update(e, t) {
            if ("object" != typeof e || B(e))
                return this.where(":id").equals(e).modify(t);
            {
                const r = ne(e, this.schema.primKey.keyPath);
                if (void 0 === r)
                    return Ht(new Ke.InvalidArgument("Given object does not contain its primary key"));
                try {
                    "function" != typeof t ? F(t).forEach((n => {
                        re(e, n, t[n])
                    }
                    )) : t(e, {
                        value: e,
                        primKey: r
                    })
                } catch (n) {}
                return this.where(":id").equals(r).modify(t)
            }
        }
        put(e, t) {
            const {auto: n, keyPath: r} = this.schema.primKey;
            let s = e;
            return r && n && (s = pn(r)(e)),
            this._trans("readwrite", (e => this.core.mutate({
                trans: e,
                type: "put",
                values: [s],
                keys: null != t ? [t] : null
            }))).then((e => e.numFailures ? pt.reject(e.failures[0]) : e.lastResult)).then((t => {
                if (r)
                    try {
                        re(e, r, t)
                    } catch (n) {}
                return t
            }
            ))
        }
        delete(e) {
            return this._trans("readwrite", (t => this.core.mutate({
                trans: t,
                type: "delete",
                keys: [e]
            }))).then((e => e.numFailures ? pt.reject(e.failures[0]) : void 0))
        }
        clear() {
            return this._trans("readwrite", (e => this.core.mutate({
                trans: e,
                type: "deleteRange",
                range: fn
            }))).then((e => e.numFailures ? pt.reject(e.failures[0]) : void 0))
        }
        bulkGet(e) {
            return this._trans("readonly", (t => this.core.getMany({
                keys: e,
                trans: t
            }).then((e => e.map((e => this.hook.reading.fire(e)))))))
        }
        bulkAdd(e, t, n) {
            const r = Array.isArray(t) ? t : void 0
              , s = (n = n || (r ? void 0 : t)) ? n.allKeys : void 0;
            return this._trans("readwrite", (t => {
                const {auto: n, keyPath: i} = this.schema.primKey;
                if (i && r)
                    throw new Ke.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
                if (r && r.length !== e.length)
                    throw new Ke.InvalidArgument("Arguments objects and keys must have the same length");
                const a = e.length;
                let o = i && n ? e.map(pn(i)) : e;
                return this.core.mutate({
                    trans: t,
                    type: "add",
                    keys: r,
                    values: o,
                    wantResults: s
                }).then(( ({numFailures: e, results: t, lastResult: n, failures: r}) => {
                    if (0 === e)
                        return s ? t : n;
                    throw new Re(`${this.name}.bulkAdd(): ${e} of ${a} operations failed`,r)
                }
                ))
            }
            ))
        }
        bulkPut(e, t, n) {
            const r = Array.isArray(t) ? t : void 0
              , s = (n = n || (r ? void 0 : t)) ? n.allKeys : void 0;
            return this._trans("readwrite", (t => {
                const {auto: n, keyPath: i} = this.schema.primKey;
                if (i && r)
                    throw new Ke.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
                if (r && r.length !== e.length)
                    throw new Ke.InvalidArgument("Arguments objects and keys must have the same length");
                const a = e.length;
                let o = i && n ? e.map(pn(i)) : e;
                return this.core.mutate({
                    trans: t,
                    type: "put",
                    keys: r,
                    values: o,
                    wantResults: s
                }).then(( ({numFailures: e, results: t, lastResult: n, failures: r}) => {
                    if (0 === e)
                        return s ? t : n;
                    throw new Re(`${this.name}.bulkPut(): ${e} of ${a} operations failed`,r)
                }
                ))
            }
            ))
        }
        bulkDelete(e) {
            const t = e.length;
            return this._trans("readwrite", (t => this.core.mutate({
                trans: t,
                type: "delete",
                keys: e
            }))).then(( ({numFailures: e, lastResult: n, failures: r}) => {
                if (0 === e)
                    return n;
                throw new Re(`${this.name}.bulkDelete(): ${e} of ${t} operations failed`,r)
            }
            ))
        }
    }
    function yn(e) {
        var t = {}
          , n = function(n, r) {
            if (r) {
                for (var s = arguments.length, i = new Array(s - 1); --s; )
                    i[s - 1] = arguments[s];
                return t[n].subscribe.apply(null, i),
                e
            }
            if ("string" == typeof n)
                return t[n]
        };
        n.addEventType = i;
        for (var r = 1, s = arguments.length; r < s; ++r)
            i(arguments[r]);
        return n;
        function i(e, r, s) {
            if ("object" != typeof e) {
                var a;
                r || (r = We),
                s || (s = Me);
                var o = {
                    subscribers: [],
                    fire: s,
                    subscribe: function(e) {
                        -1 === o.subscribers.indexOf(e) && (o.subscribers.push(e),
                        o.fire = r(o.fire, e))
                    },
                    unsubscribe: function(e) {
                        o.subscribers = o.subscribers.filter((function(t) {
                            return t !== e
                        }
                        )),
                        o.fire = o.subscribers.reduce(r, s)
                    }
                };
                return t[e] = n[e] = o,
                o
            }
            F(a = e).forEach((function(e) {
                var t = a[e];
                if (B(t))
                    i(e, a[e][0], a[e][1]);
                else {
                    if ("asap" !== t)
                        throw new Ke.InvalidArgument("Invalid event config");
                    var n = i(e, Fe, (function() {
                        for (var e = arguments.length, t = new Array(e); e--; )
                            t[e] = arguments[e];
                        n.subscribers.forEach((function(e) {
                            ee((function() {
                                e.apply(null, t)
                            }
                            ))
                        }
                        ))
                    }
                    ))
                }
            }
            ))
        }
    }
    function gn(e, t) {
        return z(t).from({
            prototype: e
        }),
        t
    }
    function vn(e, t) {
        return !(e.filter || e.algorithm || e.or) && (t ? e.justLimit : !e.replayFilter)
    }
    function bn(e, t) {
        e.filter = dn(e.filter, t)
    }
    function wn(e, t, n) {
        var r = e.replayFilter;
        e.replayFilter = r ? () => dn(r(), t()) : t,
        e.justLimit = n && !r
    }
    function _n(e, t) {
        if (e.isPrimKey)
            return t.primaryKey;
        const n = t.getIndexByKeyPath(e.index);
        if (!n)
            throw new Ke.Schema("KeyPath " + e.index + " on object store " + t.name + " is not indexed");
        return n
    }
    function kn(e, t, n) {
        const r = _n(e, t.schema);
        return t.openCursor({
            trans: n,
            values: !e.keysOnly,
            reverse: "prev" === e.dir,
            unique: !!e.unique,
            query: {
                index: r,
                range: e.range
            }
        })
    }
    function xn(e, t, n, r) {
        const s = e.replayFilter ? dn(e.filter, e.replayFilter()) : e.filter;
        if (e.or) {
            const i = {}
              , a = (e, n, r) => {
                if (!s || s(n, r, (e => n.stop(e)), (e => n.fail(e)))) {
                    var a = n.primaryKey
                      , o = "" + a;
                    "[object ArrayBuffer]" === o && (o = "" + new Uint8Array(a)),
                    $(i, o) || (i[o] = !0,
                    t(e, n, r))
                }
            }
            ;
            return Promise.all([e.or._iterate(a, n), En(kn(e, r, n), e.algorithm, a, !e.keysOnly && e.valueMapper)])
        }
        return En(kn(e, r, n), dn(e.algorithm, s), t, !e.keysOnly && e.valueMapper)
    }
    function En(e, t, n, r) {
        var s = Pt(r ? (e, t, s) => n(r(e), t, s) : n);
        return e.then((e => {
            if (e)
                return e.start(( () => {
                    var n = () => e.continue();
                    t && !t(e, (e => n = e), (t => {
                        e.stop(t),
                        n = Me
                    }
                    ), (t => {
                        e.fail(t),
                        n = Me
                    }
                    )) || s(e.value, e, (e => n = e)),
                    n()
                }
                ))
        }
        ))
    }
    function Sn(e, t) {
        try {
            const n = qn(e)
              , r = qn(t);
            if (n !== r)
                return "Array" === n ? 1 : "Array" === r ? -1 : "binary" === n ? 1 : "binary" === r ? -1 : "string" === n ? 1 : "string" === r ? -1 : "Date" === n ? 1 : "Date" !== r ? NaN : -1;
            switch (n) {
            case "number":
            case "Date":
            case "string":
                return e > t ? 1 : e < t ? -1 : 0;
            case "binary":
                return function(e, t) {
                    const n = e.length
                      , r = t.length
                      , s = n < r ? n : r;
                    for (let i = 0; i < s; ++i)
                        if (e[i] !== t[i])
                            return e[i] < t[i] ? -1 : 1;
                    return n === r ? 0 : n < r ? -1 : 1
                }(Tn(e), Tn(t));
            case "Array":
                return function(e, t) {
                    const n = e.length
                      , r = t.length
                      , s = n < r ? n : r;
                    for (let i = 0; i < s; ++i) {
                        const n = Sn(e[i], t[i]);
                        if (0 !== n)
                            return n
                    }
                    return n === r ? 0 : n < r ? -1 : 1
                }(e, t)
            }
        } catch (n) {}
        return NaN
    }
    function qn(e) {
        const t = typeof e;
        if ("object" !== t)
            return t;
        if (ArrayBuffer.isView(e))
            return "binary";
        const n = fe(e);
        return "ArrayBuffer" === n ? "binary" : n
    }
    function Tn(e) {
        return e instanceof Uint8Array ? e : ArrayBuffer.isView(e) ? new Uint8Array(e.buffer,e.byteOffset,e.byteLength) : new Uint8Array(e)
    }
    class In {
        _read(e, t) {
            var n = this._ctx;
            return n.error ? n.table._trans(null, Ht.bind(null, n.error)) : n.table._trans("readonly", e).then(t)
        }
        _write(e) {
            var t = this._ctx;
            return t.error ? t.table._trans(null, Ht.bind(null, t.error)) : t.table._trans("readwrite", e, "locked")
        }
        _addAlgorithm(e) {
            var t = this._ctx;
            t.algorithm = dn(t.algorithm, e)
        }
        _iterate(e, t) {
            return xn(this._ctx, e, t, this._ctx.table.core)
        }
        clone(e) {
            var t = Object.create(this.constructor.prototype)
              , n = Object.create(this._ctx);
            return e && N(n, e),
            t._ctx = n,
            t
        }
        raw() {
            return this._ctx.valueMapper = null,
            this
        }
        each(e) {
            var t = this._ctx;
            return this._read((n => xn(t, e, n, t.table.core)))
        }
        count(e) {
            return this._read((e => {
                const t = this._ctx
                  , n = t.table.core;
                if (vn(t, !0))
                    return n.count({
                        trans: e,
                        query: {
                            index: _n(t, n.schema),
                            range: t.range
                        }
                    }).then((e => Math.min(e, t.limit)));
                var r = 0;
                return xn(t, ( () => (++r,
                !1)), e, n).then(( () => r))
            }
            )).then(e)
        }
        sortBy(e, t) {
            const n = e.split(".").reverse()
              , r = n[0]
              , s = n.length - 1;
            function i(e, t) {
                return t ? i(e[n[t]], t - 1) : e[r]
            }
            var a = "next" === this._ctx.dir ? 1 : -1;
            function o(e, t) {
                var n = i(e, s)
                  , r = i(t, s);
                return n < r ? -a : n > r ? a : 0
            }
            return this.toArray((function(e) {
                return e.sort(o)
            }
            )).then(t)
        }
        toArray(e) {
            return this._read((e => {
                var t = this._ctx;
                if ("next" === t.dir && vn(t, !0) && t.limit > 0) {
                    const {valueMapper: n} = t
                      , r = _n(t, t.table.core.schema);
                    return t.table.core.query({
                        trans: e,
                        limit: t.limit,
                        values: !0,
                        query: {
                            index: r,
                            range: t.range
                        }
                    }).then(( ({result: e}) => n ? e.map(n) : e))
                }
                {
                    const n = [];
                    return xn(t, (e => n.push(e)), e, t.table.core).then(( () => n))
                }
            }
            ), e)
        }
        offset(e) {
            var t = this._ctx;
            return e <= 0 || (t.offset += e,
            vn(t) ? wn(t, ( () => {
                var t = e;
                return (e, n) => 0 === t || (1 === t ? (--t,
                !1) : (n(( () => {
                    e.advance(t),
                    t = 0
                }
                )),
                !1))
            }
            )) : wn(t, ( () => {
                var t = e;
                return () => --t < 0
            }
            ))),
            this
        }
        limit(e) {
            return this._ctx.limit = Math.min(this._ctx.limit, e),
            wn(this._ctx, ( () => {
                var t = e;
                return function(e, n, r) {
                    return --t <= 0 && n(r),
                    t >= 0
                }
            }
            ), !0),
            this
        }
        until(e, t) {
            return bn(this._ctx, (function(n, r, s) {
                return !e(n.value) || (r(s),
                t)
            }
            )),
            this
        }
        first(e) {
            return this.limit(1).toArray((function(e) {
                return e[0]
            }
            )).then(e)
        }
        last(e) {
            return this.reverse().first(e)
        }
        filter(e) {
            var t, n;
            return bn(this._ctx, (function(t) {
                return e(t.value)
            }
            )),
            t = this._ctx,
            n = e,
            t.isMatch = dn(t.isMatch, n),
            this
        }
        and(e) {
            return this.filter(e)
        }
        or(e) {
            return new this.db.WhereClause(this._ctx.table,e,this)
        }
        reverse() {
            return this._ctx.dir = "prev" === this._ctx.dir ? "next" : "prev",
            this._ondirectionchange && this._ondirectionchange(this._ctx.dir),
            this
        }
        desc() {
            return this.reverse()
        }
        eachKey(e) {
            var t = this._ctx;
            return t.keysOnly = !t.isMatch,
            this.each((function(t, n) {
                e(n.key, n)
            }
            ))
        }
        eachUniqueKey(e) {
            return this._ctx.unique = "unique",
            this.eachKey(e)
        }
        eachPrimaryKey(e) {
            var t = this._ctx;
            return t.keysOnly = !t.isMatch,
            this.each((function(t, n) {
                e(n.primaryKey, n)
            }
            ))
        }
        keys(e) {
            var t = this._ctx;
            t.keysOnly = !t.isMatch;
            var n = [];
            return this.each((function(e, t) {
                n.push(t.key)
            }
            )).then((function() {
                return n
            }
            )).then(e)
        }
        primaryKeys(e) {
            var t = this._ctx;
            if ("next" === t.dir && vn(t, !0) && t.limit > 0)
                return this._read((e => {
                    var n = _n(t, t.table.core.schema);
                    return t.table.core.query({
                        trans: e,
                        values: !1,
                        limit: t.limit,
                        query: {
                            index: n,
                            range: t.range
                        }
                    })
                }
                )).then(( ({result: e}) => e)).then(e);
            t.keysOnly = !t.isMatch;
            var n = [];
            return this.each((function(e, t) {
                n.push(t.primaryKey)
            }
            )).then((function() {
                return n
            }
            )).then(e)
        }
        uniqueKeys(e) {
            return this._ctx.unique = "unique",
            this.keys(e)
        }
        firstKey(e) {
            return this.limit(1).keys((function(e) {
                return e[0]
            }
            )).then(e)
        }
        lastKey(e) {
            return this.reverse().firstKey(e)
        }
        distinct() {
            var e = this._ctx
              , t = e.index && e.table.schema.idxByName[e.index];
            if (!t || !t.multi)
                return this;
            var n = {};
            return bn(this._ctx, (function(e) {
                var t = e.primaryKey.toString()
                  , r = $(n, t);
                return n[t] = !0,
                !r
            }
            )),
            this
        }
        modify(e) {
            var t = this._ctx;
            return this._write((n => {
                var r;
                if ("function" == typeof e)
                    r = e;
                else {
                    var s = F(e)
                      , i = s.length;
                    r = function(t) {
                        for (var n = !1, r = 0; r < i; ++r) {
                            var a = s[r]
                              , o = e[a];
                            ne(t, a) !== o && (re(t, a, o),
                            n = !0)
                        }
                        return n
                    }
                }
                const a = t.table.core
                  , {outbound: o, extractKey: u} = a.schema.primaryKey
                  , l = this.db._options.modifyChunkSize || 200
                  , c = [];
                let h = 0;
                const d = []
                  , f = (e, t) => {
                    const {failures: n, numFailures: r} = t;
                    h += e - r;
                    for (let s of F(n))
                        c.push(n[s])
                }
                ;
                return this.clone().primaryKeys().then((s => {
                    const i = c => {
                        const h = Math.min(l, s.length - c);
                        return a.getMany({
                            trans: n,
                            keys: s.slice(c, c + h),
                            cache: "immutable"
                        }).then((d => {
                            const p = []
                              , m = []
                              , y = o ? [] : null
                              , g = [];
                            for (let e = 0; e < h; ++e) {
                                const t = d[e]
                                  , n = {
                                    value: ce(t),
                                    primKey: s[c + e]
                                };
                                !1 !== r.call(n, n.value, n) && (null == n.value ? g.push(s[c + e]) : o || 0 === Sn(u(t), u(n.value)) ? (m.push(n.value),
                                o && y.push(s[c + e])) : (g.push(s[c + e]),
                                p.push(n.value)))
                            }
                            const v = vn(t) && t.limit === 1 / 0 && ("function" != typeof e || e === Pn) && {
                                index: t.index,
                                range: t.range
                            };
                            return Promise.resolve(p.length > 0 && a.mutate({
                                trans: n,
                                type: "add",
                                values: p
                            }).then((e => {
                                for (let t in e.failures)
                                    g.splice(parseInt(t), 1);
                                f(p.length, e)
                            }
                            ))).then(( () => (m.length > 0 || v && "object" == typeof e) && a.mutate({
                                trans: n,
                                type: "put",
                                keys: y,
                                values: m,
                                criteria: v,
                                changeSpec: "function" != typeof e && e
                            }).then((e => f(m.length, e))))).then(( () => (g.length > 0 || v && e === Pn) && a.mutate({
                                trans: n,
                                type: "delete",
                                keys: g,
                                criteria: v
                            }).then((e => f(g.length, e))))).then(( () => s.length > c + h && i(c + l)))
                        }
                        ))
                    }
                    ;
                    return i(0).then(( () => {
                        if (c.length > 0)
                            throw new Ce("Error modifying one or more objects",c,h,d);
                        return s.length
                    }
                    ))
                }
                ))
            }
            ))
        }
        delete() {
            var e = this._ctx
              , t = e.range;
            return vn(e) && (e.isPrimKey && !on || 3 === t.type) ? this._write((n => {
                const {primaryKey: r} = e.table.core.schema
                  , s = t;
                return e.table.core.count({
                    trans: n,
                    query: {
                        index: r,
                        range: s
                    }
                }).then((t => e.table.core.mutate({
                    trans: n,
                    type: "deleteRange",
                    range: s
                }).then(( ({failures: e, lastResult: n, results: r, numFailures: s}) => {
                    if (s)
                        throw new Ce("Could not delete some values",Object.keys(e).map((t => e[t])),t - s);
                    return t - s
                }
                ))))
            }
            )) : this.modify(Pn)
        }
    }
    const Pn = (e, t) => t.value = null;
    function Cn(e, t) {
        return e < t ? -1 : e === t ? 0 : 1
    }
    function Rn(e, t) {
        return e > t ? -1 : e === t ? 0 : 1
    }
    function An(e, t, n) {
        var r = e instanceof Fn ? new e.Collection(e) : e;
        return r._ctx.error = n ? new n(t) : new TypeError(t),
        r
    }
    function On(e) {
        return new e.Collection(e,( () => Mn(""))).limit(0)
    }
    function Kn(e, t, n, r, s, i) {
        for (var a = Math.min(e.length, r.length), o = -1, u = 0; u < a; ++u) {
            var l = t[u];
            if (l !== r[u])
                return s(e[u], n[u]) < 0 ? e.substr(0, u) + n[u] + n.substr(u + 1) : s(e[u], r[u]) < 0 ? e.substr(0, u) + r[u] + n.substr(u + 1) : o >= 0 ? e.substr(0, o) + t[o] + n.substr(o + 1) : null;
            s(e[u], l) < 0 && (o = u)
        }
        return a < r.length && "next" === i ? e + n.substr(e.length) : a < e.length && "prev" === i ? e.substr(0, n.length) : o < 0 ? null : e.substr(0, o) + r[o] + n.substr(o + 1)
    }
    function Dn(e, t, n, r) {
        var s, i, a, o, u, l, c, h = n.length;
        if (!n.every((e => "string" == typeof e)))
            return An(e, nn);
        function d(e) {
            s = function(e) {
                return "next" === e ? e => e.toUpperCase() : e => e.toLowerCase()
            }(e),
            i = function(e) {
                return "next" === e ? e => e.toLowerCase() : e => e.toUpperCase()
            }(e),
            a = "next" === e ? Cn : Rn;
            var t = n.map((function(e) {
                return {
                    lower: i(e),
                    upper: s(e)
                }
            }
            )).sort((function(e, t) {
                return a(e.lower, t.lower)
            }
            ));
            o = t.map((function(e) {
                return e.upper
            }
            )),
            u = t.map((function(e) {
                return e.lower
            }
            )),
            l = e,
            c = "next" === e ? "" : r
        }
        d("next");
        var f = new e.Collection(e,( () => jn(o[0], u[h - 1] + r)));
        f._ondirectionchange = function(e) {
            d(e)
        }
        ;
        var p = 0;
        return f._addAlgorithm((function(e, n, r) {
            var s = e.key;
            if ("string" != typeof s)
                return !1;
            var d = i(s);
            if (t(d, u, p))
                return !0;
            for (var f = null, m = p; m < h; ++m) {
                var y = Kn(s, d, o[m], u[m], a, l);
                null === y && null === f ? p = m + 1 : (null === f || a(f, y) > 0) && (f = y)
            }
            return n(null !== f ? function() {
                e.continue(f + c)
            }
            : r),
            !1
        }
        )),
        f
    }
    function jn(e, t, n, r) {
        return {
            type: 2,
            lower: e,
            upper: t,
            lowerOpen: n,
            upperOpen: r
        }
    }
    function Mn(e) {
        return {
            type: 1,
            lower: e,
            upper: e
        }
    }
    class Fn {
        get Collection() {
            return this._ctx.table.db.Collection
        }
        between(e, t, n, r) {
            n = !1 !== n,
            r = !0 === r;
            try {
                return this._cmp(e, t) > 0 || 0 === this._cmp(e, t) && (n || r) && (!n || !r) ? On(this) : new this.Collection(this,( () => jn(e, t, !n, !r)))
            } catch (s) {
                return An(this, tn)
            }
        }
        equals(e) {
            return null == e ? An(this, tn) : new this.Collection(this,( () => Mn(e)))
        }
        above(e) {
            return null == e ? An(this, tn) : new this.Collection(this,( () => jn(e, void 0, !0)))
        }
        aboveOrEqual(e) {
            return null == e ? An(this, tn) : new this.Collection(this,( () => jn(e, void 0, !1)))
        }
        below(e) {
            return null == e ? An(this, tn) : new this.Collection(this,( () => jn(void 0, e, !1, !0)))
        }
        belowOrEqual(e) {
            return null == e ? An(this, tn) : new this.Collection(this,( () => jn(void 0, e)))
        }
        startsWith(e) {
            return "string" != typeof e ? An(this, nn) : this.between(e, e + Zt, !0, !0)
        }
        startsWithIgnoreCase(e) {
            return "" === e ? this.startsWith(e) : Dn(this, ( (e, t) => 0 === e.indexOf(t[0])), [e], Zt)
        }
        equalsIgnoreCase(e) {
            return Dn(this, ( (e, t) => e === t[0]), [e], "")
        }
        anyOfIgnoreCase() {
            var e = ge.apply(ye, arguments);
            return 0 === e.length ? On(this) : Dn(this, ( (e, t) => -1 !== t.indexOf(e)), e, "")
        }
        startsWithAnyOfIgnoreCase() {
            var e = ge.apply(ye, arguments);
            return 0 === e.length ? On(this) : Dn(this, ( (e, t) => t.some((t => 0 === e.indexOf(t)))), e, Zt)
        }
        anyOf() {
            const e = ge.apply(ye, arguments);
            let t = this._cmp;
            try {
                e.sort(t)
            } catch (s) {
                return An(this, tn)
            }
            if (0 === e.length)
                return On(this);
            const n = new this.Collection(this,( () => jn(e[0], e[e.length - 1])));
            n._ondirectionchange = n => {
                t = "next" === n ? this._ascending : this._descending,
                e.sort(t)
            }
            ;
            let r = 0;
            return n._addAlgorithm(( (n, s, i) => {
                const a = n.key;
                for (; t(a, e[r]) > 0; )
                    if (++r,
                    r === e.length)
                        return s(i),
                        !1;
                return 0 === t(a, e[r]) || (s(( () => {
                    n.continue(e[r])
                }
                )),
                !1)
            }
            )),
            n
        }
        notEqual(e) {
            return this.inAnyRange([[en, e], [e, this.db._maxKey]], {
                includeLowers: !1,
                includeUppers: !1
            })
        }
        noneOf() {
            const e = ge.apply(ye, arguments);
            if (0 === e.length)
                return new this.Collection(this);
            try {
                e.sort(this._ascending)
            } catch (n) {
                return An(this, tn)
            }
            const t = e.reduce(( (e, t) => e ? e.concat([[e[e.length - 1][1], t]]) : [[en, t]]), null);
            return t.push([e[e.length - 1], this.db._maxKey]),
            this.inAnyRange(t, {
                includeLowers: !1,
                includeUppers: !1
            })
        }
        inAnyRange(e, t) {
            const n = this._cmp
              , r = this._ascending
              , s = this._descending
              , i = this._min
              , a = this._max;
            if (0 === e.length)
                return On(this);
            if (!e.every((e => void 0 !== e[0] && void 0 !== e[1] && r(e[0], e[1]) <= 0)))
                return An(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", Ke.InvalidArgument);
            const o = !t || !1 !== t.includeLowers
              , u = t && !0 === t.includeUppers;
            let l, c = r;
            function h(e, t) {
                return c(e[0], t[0])
            }
            try {
                l = e.reduce((function(e, t) {
                    let r = 0
                      , s = e.length;
                    for (; r < s; ++r) {
                        const s = e[r];
                        if (n(t[0], s[1]) < 0 && n(t[1], s[0]) > 0) {
                            s[0] = i(s[0], t[0]),
                            s[1] = a(s[1], t[1]);
                            break
                        }
                    }
                    return r === s && e.push(t),
                    e
                }
                ), []),
                l.sort(h)
            } catch (g) {
                return An(this, tn)
            }
            let d = 0;
            const f = u ? e => r(e, l[d][1]) > 0 : e => r(e, l[d][1]) >= 0
              , p = o ? e => s(e, l[d][0]) > 0 : e => s(e, l[d][0]) >= 0;
            let m = f;
            const y = new this.Collection(this,( () => jn(l[0][0], l[l.length - 1][1], !o, !u)));
            return y._ondirectionchange = e => {
                "next" === e ? (m = f,
                c = r) : (m = p,
                c = s),
                l.sort(h)
            }
            ,
            y._addAlgorithm(( (e, t, n) => {
                for (var s = e.key; m(s); )
                    if (++d,
                    d === l.length)
                        return t(n),
                        !1;
                return !(i = s,
                (f(i) || p(i)) && (0 === this._cmp(s, l[d][1]) || 0 === this._cmp(s, l[d][0]) || t(( () => {
                    c === r ? e.continue(l[d][0]) : e.continue(l[d][1])
                }
                )),
                1));
                var i
            }
            )),
            y
        }
        startsWithAnyOf() {
            const e = ge.apply(ye, arguments);
            return e.every((e => "string" == typeof e)) ? 0 === e.length ? On(this) : this.inAnyRange(e.map((e => [e, e + Zt]))) : An(this, "startsWithAnyOf() only works with strings")
        }
    }
    function Bn(e) {
        return Pt((function(t) {
            return Nn(t),
            e(t.target.error),
            !1
        }
        ))
    }
    function Nn(e) {
        e.stopPropagation && e.stopPropagation(),
        e.preventDefault && e.preventDefault()
    }
    const Un = "storagemutated"
      , Ln = "x-storagemutated-1"
      , $n = yn(null, Un);
    class Wn {
        _lock() {
            return Z(!ct.global),
            ++this._reculock,
            1 !== this._reculock || ct.global || (ct.lockOwnerFor = this),
            this
        }
        _unlock() {
            if (Z(!ct.global),
            0 == --this._reculock)
                for (ct.global || (ct.lockOwnerFor = null); this._blockedFuncs.length > 0 && !this._locked(); ) {
                    var e = this._blockedFuncs.shift();
                    try {
                        Wt(e[1], e[0])
                    } catch (t) {}
                }
            return this
        }
        _locked() {
            return this._reculock && ct.lockOwnerFor !== this
        }
        create(e) {
            if (!this.mode)
                return this;
            const t = this.db.idbdb
              , n = this.db._state.dbOpenError;
            if (Z(!this.idbtrans),
            !e && !t)
                switch (n && n.name) {
                case "DatabaseClosedError":
                    throw new Ke.DatabaseClosed(n);
                case "MissingAPIError":
                    throw new Ke.MissingAPI(n.message,n);
                default:
                    throw new Ke.OpenFailed(n)
                }
            if (!this.active)
                throw new Ke.TransactionInactive;
            return Z(null === this._completion._state),
            (e = this.idbtrans = e || (this.db.core ? this.db.core.transaction(this.storeNames, this.mode, {
                durability: this.chromeTransactionDurability
            }) : t.transaction(this.storeNames, this.mode, {
                durability: this.chromeTransactionDurability
            }))).onerror = Pt((t => {
                Nn(t),
                this._reject(e.error)
            }
            )),
            e.onabort = Pt((t => {
                Nn(t),
                this.active && this._reject(new Ke.Abort(e.error)),
                this.active = !1,
                this.on("abort").fire(t)
            }
            )),
            e.oncomplete = Pt(( () => {
                this.active = !1,
                this._resolve(),
                "mutatedParts"in e && $n.storagemutated.fire(e.mutatedParts)
            }
            )),
            this
        }
        _promise(e, t, n) {
            if ("readwrite" === e && "readwrite" !== this.mode)
                return Ht(new Ke.ReadOnly("Transaction is readonly"));
            if (!this.active)
                return Ht(new Ke.TransactionInactive);
            if (this._locked())
                return new pt(( (r, s) => {
                    this._blockedFuncs.push([ () => {
                        this._promise(e, t, n).then(r, s)
                    }
                    , ct])
                }
                ));
            if (n)
                return jt(( () => {
                    var e = new pt(( (e, n) => {
                        this._lock();
                        const r = t(e, n, this);
                        r && r.then && r.then(e, n)
                    }
                    ));
                    return e.finally(( () => this._unlock())),
                    e._lib = !0,
                    e
                }
                ));
            var r = new pt(( (e, n) => {
                var r = t(e, n, this);
                r && r.then && r.then(e, n)
            }
            ));
            return r._lib = !0,
            r
        }
        _root() {
            return this.parent ? this.parent._root() : this
        }
        waitFor(e) {
            var t = this._root();
            const n = pt.resolve(e);
            if (t._waitingFor)
                t._waitingFor = t._waitingFor.then(( () => n));
            else {
                t._waitingFor = n,
                t._waitingQueue = [];
                var r = t.idbtrans.objectStore(t.storeNames[0]);
                !function e() {
                    for (++t._spinCount; t._waitingQueue.length; )
                        t._waitingQueue.shift()();
                    t._waitingFor && (r.get(-1 / 0).onsuccess = e)
                }()
            }
            var s = t._waitingFor;
            return new pt(( (e, r) => {
                n.then((n => t._waitingQueue.push(Pt(e.bind(null, n)))), (e => t._waitingQueue.push(Pt(r.bind(null, e))))).finally(( () => {
                    t._waitingFor === s && (t._waitingFor = null)
                }
                ))
            }
            ))
        }
        abort() {
            this.active && (this.active = !1,
            this.idbtrans && this.idbtrans.abort(),
            this._reject(new Ke.Abort))
        }
        table(e) {
            const t = this._memoizedTables || (this._memoizedTables = {});
            if ($(t, e))
                return t[e];
            const n = this.schema[e];
            if (!n)
                throw new Ke.NotFound("Table " + e + " not part of transaction");
            const r = new this.db.Table(e,n,this);
            return r.core = this.db.core.table(e),
            t[e] = r,
            r
        }
    }
    function Vn(e, t, n, r, s, i, a) {
        return {
            name: e,
            keyPath: t,
            unique: n,
            multi: r,
            auto: s,
            compound: i,
            src: (n && !a ? "&" : "") + (r ? "*" : "") + (s ? "++" : "") + Qn(t)
        }
    }
    function Qn(e) {
        return "string" == typeof e ? e : e ? "[" + [].join.call(e, "+") + "]" : ""
    }
    function zn(e, t, n) {
        return {
            name: e,
            primKey: t,
            indexes: n,
            mappedClass: null,
            idxByName: te(n, (e => [e.name, e]))
        }
    }
    let Xn = e => {
        try {
            return e.only([[]]),
            Xn = () => [[]],
            [[]]
        } catch (t) {
            return Xn = () => Zt,
            Zt
        }
    }
    ;
    function Yn(e) {
        return null == e ? () => {}
        : "string" == typeof e ? 1 === (t = e).split(".").length ? e => e[t] : e => ne(e, t) : t => ne(t, e);
        var t
    }
    function Hn(e) {
        return [].slice.call(e)
    }
    let Gn = 0;
    function Jn(e) {
        return null == e ? ":id" : "string" == typeof e ? e : `[${e.join("+")}]`
    }
    function Zn({_novip: e}, t) {
        const n = t.db
          , r = function(e, t, {IDBKeyRange: n, indexedDB: r}, s) {
            const i = (a = function(e, t, n) {
                function r(e) {
                    if (3 === e.type)
                        return null;
                    if (4 === e.type)
                        throw new Error("Cannot convert never type to IDBKeyRange");
                    const {lower: n, upper: r, lowerOpen: s, upperOpen: i} = e;
                    return void 0 === n ? void 0 === r ? null : t.upperBound(r, !!i) : void 0 === r ? t.lowerBound(n, !!s) : t.bound(n, r, !!s, !!i)
                }
                const {schema: s, hasGetAll: i} = function(e, t) {
                    const n = Hn(e.objectStoreNames);
                    return {
                        schema: {
                            name: e.name,
                            tables: n.map((e => t.objectStore(e))).map((e => {
                                const {keyPath: t, autoIncrement: n} = e
                                  , r = B(t)
                                  , s = null == t
                                  , i = {}
                                  , a = {
                                    name: e.name,
                                    primaryKey: {
                                        name: null,
                                        isPrimaryKey: !0,
                                        outbound: s,
                                        compound: r,
                                        keyPath: t,
                                        autoIncrement: n,
                                        unique: !0,
                                        extractKey: Yn(t)
                                    },
                                    indexes: Hn(e.indexNames).map((t => e.index(t))).map((e => {
                                        const {name: t, unique: n, multiEntry: r, keyPath: s} = e
                                          , a = {
                                            name: t,
                                            compound: B(s),
                                            keyPath: s,
                                            unique: n,
                                            multiEntry: r,
                                            extractKey: Yn(s)
                                        };
                                        return i[Jn(s)] = a,
                                        a
                                    }
                                    )),
                                    getIndexByKeyPath: e => i[Jn(e)]
                                };
                                return i[":id"] = a.primaryKey,
                                null != t && (i[Jn(t)] = a.primaryKey),
                                a
                            }
                            ))
                        },
                        hasGetAll: n.length > 0 && "getAll"in t.objectStore(n[0]) && !("undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604)
                    }
                }(e, n)
                  , a = s.tables.map((e => function(e) {
                    const t = e.name;
                    return {
                        name: t,
                        schema: e,
                        mutate: function({trans: e, type: n, keys: s, values: i, range: a}) {
                            return new Promise(( (o, u) => {
                                o = Pt(o);
                                const l = e.objectStore(t)
                                  , c = null == l.keyPath
                                  , h = "put" === n || "add" === n;
                                if (!h && "delete" !== n && "deleteRange" !== n)
                                    throw new Error("Invalid operation type: " + n);
                                const {length: d} = s || i || {
                                    length: 1
                                };
                                if (s && i && s.length !== i.length)
                                    throw new Error("Given keys array must have same length as given values array.");
                                if (0 === d)
                                    return o({
                                        numFailures: 0,
                                        failures: {},
                                        results: [],
                                        lastResult: void 0
                                    });
                                let f;
                                const p = []
                                  , m = [];
                                let y = 0;
                                const g = e => {
                                    ++y,
                                    Nn(e)
                                }
                                ;
                                if ("deleteRange" === n) {
                                    if (4 === a.type)
                                        return o({
                                            numFailures: y,
                                            failures: m,
                                            results: [],
                                            lastResult: void 0
                                        });
                                    3 === a.type ? p.push(f = l.clear()) : p.push(f = l.delete(r(a)))
                                } else {
                                    const [e,t] = h ? c ? [i, s] : [i, null] : [s, null];
                                    if (h)
                                        for (let r = 0; r < d; ++r)
                                            p.push(f = t && void 0 !== t[r] ? l[n](e[r], t[r]) : l[n](e[r])),
                                            f.onerror = g;
                                    else
                                        for (let r = 0; r < d; ++r)
                                            p.push(f = l[n](e[r])),
                                            f.onerror = g
                                }
                                const v = e => {
                                    const t = e.target.result;
                                    p.forEach(( (e, t) => null != e.error && (m[t] = e.error))),
                                    o({
                                        numFailures: y,
                                        failures: m,
                                        results: "delete" === n ? s : p.map((e => e.result)),
                                        lastResult: t
                                    })
                                }
                                ;
                                f.onerror = e => {
                                    g(e),
                                    v(e)
                                }
                                ,
                                f.onsuccess = v
                            }
                            ))
                        },
                        getMany: ({trans: e, keys: n}) => new Promise(( (r, s) => {
                            r = Pt(r);
                            const i = e.objectStore(t)
                              , a = n.length
                              , o = new Array(a);
                            let u, l = 0, c = 0;
                            const h = e => {
                                const t = e.target;
                                o[t._pos] = t.result,
                                ++c === l && r(o)
                            }
                              , d = Bn(s);
                            for (let e = 0; e < a; ++e)
                                null != n[e] && (u = i.get(n[e]),
                                u._pos = e,
                                u.onsuccess = h,
                                u.onerror = d,
                                ++l);
                            0 === l && r(o)
                        }
                        )),
                        get: ({trans: e, key: n}) => new Promise(( (r, s) => {
                            r = Pt(r);
                            const i = e.objectStore(t).get(n);
                            i.onsuccess = e => r(e.target.result),
                            i.onerror = Bn(s)
                        }
                        )),
                        query: function(e) {
                            return n => new Promise(( (s, i) => {
                                s = Pt(s);
                                const {trans: a, values: o, limit: u, query: l} = n
                                  , c = u === 1 / 0 ? void 0 : u
                                  , {index: h, range: d} = l
                                  , f = a.objectStore(t)
                                  , p = h.isPrimaryKey ? f : f.index(h.name)
                                  , m = r(d);
                                if (0 === u)
                                    return s({
                                        result: []
                                    });
                                if (e) {
                                    const e = o ? p.getAll(m, c) : p.getAllKeys(m, c);
                                    e.onsuccess = e => s({
                                        result: e.target.result
                                    }),
                                    e.onerror = Bn(i)
                                } else {
                                    let e = 0;
                                    const t = o || !("openKeyCursor"in p) ? p.openCursor(m) : p.openKeyCursor(m)
                                      , n = [];
                                    t.onsuccess = r => {
                                        const i = t.result;
                                        return i ? (n.push(o ? i.value : i.primaryKey),
                                        ++e === u ? s({
                                            result: n
                                        }) : void i.continue()) : s({
                                            result: n
                                        })
                                    }
                                    ,
                                    t.onerror = Bn(i)
                                }
                            }
                            ))
                        }(i),
                        openCursor: function({trans: e, values: n, query: s, reverse: i, unique: a}) {
                            return new Promise(( (o, u) => {
                                o = Pt(o);
                                const {index: l, range: c} = s
                                  , h = e.objectStore(t)
                                  , d = l.isPrimaryKey ? h : h.index(l.name)
                                  , f = i ? a ? "prevunique" : "prev" : a ? "nextunique" : "next"
                                  , p = n || !("openKeyCursor"in d) ? d.openCursor(r(c), f) : d.openKeyCursor(r(c), f);
                                p.onerror = Bn(u),
                                p.onsuccess = Pt((t => {
                                    const n = p.result;
                                    if (!n)
                                        return void o(null);
                                    n.___id = ++Gn,
                                    n.done = !1;
                                    const r = n.continue.bind(n);
                                    let s = n.continuePrimaryKey;
                                    s && (s = s.bind(n));
                                    const i = n.advance.bind(n)
                                      , a = () => {
                                        throw new Error("Cursor not stopped")
                                    }
                                    ;
                                    n.trans = e,
                                    n.stop = n.continue = n.continuePrimaryKey = n.advance = () => {
                                        throw new Error("Cursor not started")
                                    }
                                    ,
                                    n.fail = Pt(u),
                                    n.next = function() {
                                        let e = 1;
                                        return this.start(( () => e-- ? this.continue() : this.stop())).then(( () => this))
                                    }
                                    ,
                                    n.start = e => {
                                        const t = new Promise(( (e, t) => {
                                            e = Pt(e),
                                            p.onerror = Bn(t),
                                            n.fail = t,
                                            n.stop = t => {
                                                n.stop = n.continue = n.continuePrimaryKey = n.advance = a,
                                                e(t)
                                            }
                                        }
                                        ))
                                          , o = () => {
                                            if (p.result)
                                                try {
                                                    e()
                                                } catch (t) {
                                                    n.fail(t)
                                                }
                                            else
                                                n.done = !0,
                                                n.start = () => {
                                                    throw new Error("Cursor behind last entry")
                                                }
                                                ,
                                                n.stop()
                                        }
                                        ;
                                        return p.onsuccess = Pt((e => {
                                            p.onsuccess = o,
                                            o()
                                        }
                                        )),
                                        n.continue = r,
                                        n.continuePrimaryKey = s,
                                        n.advance = i,
                                        o(),
                                        t
                                    }
                                    ,
                                    o(n)
                                }
                                ), u)
                            }
                            ))
                        },
                        count({query: e, trans: n}) {
                            const {index: s, range: i} = e;
                            return new Promise(( (e, a) => {
                                const o = n.objectStore(t)
                                  , u = s.isPrimaryKey ? o : o.index(s.name)
                                  , l = r(i)
                                  , c = l ? u.count(l) : u.count();
                                c.onsuccess = Pt((t => e(t.target.result))),
                                c.onerror = Bn(a)
                            }
                            ))
                        }
                    }
                }(e)))
                  , o = {};
                return a.forEach((e => o[e.name] = e)),
                {
                    stack: "dbcore",
                    transaction: e.transaction.bind(e),
                    table(e) {
                        if (!o[e])
                            throw new Error(`Table '${e}' not found`);
                        return o[e]
                    },
                    MIN_KEY: -1 / 0,
                    MAX_KEY: Xn(t),
                    schema: s
                }
            }(t, n, s),
            e.dbcore.reduce(( (e, {create: t}) => ({
                ...e,
                ...t(e)
            })), a));
            var a;
            return {
                dbcore: i
            }
        }(e._middlewares, n, e._deps, t);
        e.core = r.dbcore,
        e.tables.forEach((t => {
            const n = t.name;
            e.core.schema.tables.some((e => e.name === n)) && (t.core = e.core.table(n),
            e[n]instanceof e.Table && (e[n].core = t.core))
        }
        ))
    }
    function er({_novip: e}, t, n, r) {
        n.forEach((n => {
            const s = r[n];
            t.forEach((t => {
                const r = Y(t, n);
                (!r || "value"in r && void 0 === r.value) && (t === e.Transaction.prototype || t instanceof e.Transaction ? Q(t, n, {
                    get() {
                        return this.table(n)
                    },
                    set(e) {
                        V(this, n, {
                            value: e,
                            writable: !0,
                            configurable: !0,
                            enumerable: !0
                        })
                    }
                }) : t[n] = new e.Table(n,s))
            }
            ))
        }
        ))
    }
    function tr({_novip: e}, t) {
        t.forEach((t => {
            for (let n in t)
                t[n]instanceof e.Table && delete t[n]
        }
        ))
    }
    function nr(e, t) {
        return e._cfg.version - t._cfg.version
    }
    function rr(e, t) {
        const n = {
            del: [],
            add: [],
            change: []
        };
        let r;
        for (r in e)
            t[r] || n.del.push(r);
        for (r in t) {
            const s = e[r]
              , i = t[r];
            if (s) {
                const e = {
                    name: r,
                    def: i,
                    recreate: !1,
                    del: [],
                    add: [],
                    change: []
                };
                if ("" + (s.primKey.keyPath || "") != "" + (i.primKey.keyPath || "") || s.primKey.auto !== i.primKey.auto && !sn)
                    e.recreate = !0,
                    n.change.push(e);
                else {
                    const t = s.idxByName
                      , r = i.idxByName;
                    let a;
                    for (a in t)
                        r[a] || e.del.push(a);
                    for (a in r) {
                        const n = t[a]
                          , s = r[a];
                        n ? n.src !== s.src && e.change.push(s) : e.add.push(s)
                    }
                    (e.del.length > 0 || e.add.length > 0 || e.change.length > 0) && n.change.push(e)
                }
            } else
                n.add.push([r, i])
        }
        return n
    }
    function sr(e, t, n, r) {
        const s = e.db.createObjectStore(t, n.keyPath ? {
            keyPath: n.keyPath,
            autoIncrement: n.auto
        } : {
            autoIncrement: n.auto
        });
        return r.forEach((e => ir(s, e))),
        s
    }
    function ir(e, t) {
        e.createIndex(t.name, t.keyPath, {
            unique: t.unique,
            multiEntry: t.multi
        })
    }
    function ar(e, t, n) {
        const r = {};
        return G(t.objectStoreNames, 0).forEach((e => {
            const t = n.objectStore(e);
            let s = t.keyPath;
            const i = Vn(Qn(s), s || "", !1, !1, !!t.autoIncrement, s && "string" != typeof s, !0)
              , a = [];
            for (let n = 0; n < t.indexNames.length; ++n) {
                const e = t.index(t.indexNames[n]);
                s = e.keyPath;
                var o = Vn(e.name, s, !!e.unique, !!e.multiEntry, !1, s && "string" != typeof s, !1);
                a.push(o)
            }
            r[e] = zn(e, i, a)
        }
        )),
        r
    }
    function or({_novip: e}, t, n) {
        const r = n.db.objectStoreNames;
        for (let s = 0; s < r.length; ++s) {
            const i = r[s]
              , a = n.objectStore(i);
            e._hasGetAll = "getAll"in a;
            for (let e = 0; e < a.indexNames.length; ++e) {
                const n = a.indexNames[e]
                  , r = a.index(n).keyPath
                  , s = "string" == typeof r ? r : "[" + G(r).join("+") + "]";
                if (t[i]) {
                    const e = t[i].idxByName[s];
                    e && (e.name = n,
                    delete t[i].idxByName[s],
                    t[i].idxByName[n] = e)
                }
            }
        }
        "undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && M.WorkerGlobalScope && M instanceof M.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (e._hasGetAll = !1)
    }
    class ur {
        _parseStoresSpec(e, t) {
            F(e).forEach((n => {
                if (null !== e[n]) {
                    var r = e[n].split(",").map(( (e, t) => {
                        const n = (e = e.trim()).replace(/([&*]|\+\+)/g, "")
                          , r = /^\[/.test(n) ? n.match(/^\[(.*)\]$/)[1].split("+") : n;
                        return Vn(n, r || null, /\&/.test(e), /\*/.test(e), /\+\+/.test(e), B(r), 0 === t)
                    }
                    ))
                      , s = r.shift();
                    if (s.multi)
                        throw new Ke.Schema("Primary key cannot be multi-valued");
                    r.forEach((e => {
                        if (e.auto)
                            throw new Ke.Schema("Only primary key can be marked as autoIncrement (++)");
                        if (!e.keyPath)
                            throw new Ke.Schema("Index must have a name and cannot be an empty string")
                    }
                    )),
                    t[n] = zn(n, s, r)
                }
            }
            ))
        }
        stores(e) {
            const t = this.db;
            this._cfg.storesSource = this._cfg.storesSource ? N(this._cfg.storesSource, e) : e;
            const n = t._versions
              , r = {};
            let s = {};
            return n.forEach((e => {
                N(r, e._cfg.storesSource),
                s = e._cfg.dbschema = {},
                e._parseStoresSpec(r, s)
            }
            )),
            t._dbSchema = s,
            tr(t, [t._allTables, t, t.Transaction.prototype]),
            er(t, [t._allTables, t, t.Transaction.prototype, this._cfg.tables], F(s), s),
            t._storeNames = F(s),
            this
        }
        upgrade(e) {
            return this._cfg.contentUpgrade = Ve(this._cfg.contentUpgrade || Me, e),
            this
        }
    }
    function lr(e, t) {
        let n = e._dbNamesDB;
        return n || (n = e._dbNamesDB = new Rr(ln,{
            addons: [],
            indexedDB: e,
            IDBKeyRange: t
        }),
        n.version(1).stores({
            dbnames: "name"
        })),
        n.table("dbnames")
    }
    function cr(e) {
        return e && "function" == typeof e.databases
    }
    function hr(e) {
        return jt((function() {
            return ct.letThrough = !0,
            e()
        }
        ))
    }
    function dr() {
        var e;
        return !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise((function(t) {
            var n = function() {
                return indexedDB.databases().finally(t)
            };
            e = setInterval(n, 100),
            n()
        }
        )).finally((function() {
            return clearInterval(e)
        }
        )) : Promise.resolve()
    }
    function fr(e) {
        const t = e._state
          , {indexedDB: n} = e._deps;
        if (t.isBeingOpened || e.idbdb)
            return t.dbReadyPromise.then(( () => t.dbOpenError ? Ht(t.dbOpenError) : e));
        be && (t.openCanceller._stackHolder = xe()),
        t.isBeingOpened = !0,
        t.dbOpenError = null,
        t.openComplete = !1;
        const r = t.openCanceller;
        function s() {
            if (t.openCanceller !== r)
                throw new Ke.DatabaseClosed("db.open() was cancelled")
        }
        let i = t.dbReadyResolve
          , a = null
          , o = !1;
        const u = () => new pt(( (r, i) => {
            if (s(),
            !n)
                throw new Ke.MissingAPI;
            const u = e.name
              , l = t.autoSchema ? n.open(u) : n.open(u, Math.round(10 * e.verno));
            if (!l)
                throw new Ke.MissingAPI;
            l.onerror = Bn(i),
            l.onblocked = Pt(e._fireOnBlocked),
            l.onupgradeneeded = Pt((r => {
                if (a = l.transaction,
                t.autoSchema && !e._options.allowEmptyDB) {
                    l.onerror = Nn,
                    a.abort(),
                    l.result.close();
                    const e = n.deleteDatabase(u);
                    e.onsuccess = e.onerror = Pt(( () => {
                        i(new Ke.NoSuchDatabase(`Database ${u} doesnt exist`))
                    }
                    ))
                } else {
                    a.onerror = Bn(i);
                    var s = r.oldVersion > Math.pow(2, 62) ? 0 : r.oldVersion;
                    o = s < 1,
                    e._novip.idbdb = l.result,
                    function(e, t, n, r) {
                        const s = e._dbSchema
                          , i = e._createTransaction("readwrite", e._storeNames, s);
                        i.create(n),
                        i._completion.catch(r);
                        const a = i._reject.bind(i)
                          , o = ct.transless || ct;
                        jt(( () => {
                            ct.trans = i,
                            ct.transless = o,
                            0 === t ? (F(s).forEach((e => {
                                sr(n, e, s[e].primKey, s[e].indexes)
                            }
                            )),
                            Zn(e, n),
                            pt.follow(( () => e.on.populate.fire(i))).catch(a)) : function({_novip: e}, t, n, r) {
                                const s = []
                                  , i = e._versions;
                                let a = e._dbSchema = ar(0, e.idbdb, r)
                                  , o = !1;
                                return i.filter((e => e._cfg.version >= t)).forEach((i => {
                                    s.push(( () => {
                                        const s = a
                                          , u = i._cfg.dbschema;
                                        or(e, s, r),
                                        or(e, u, r),
                                        a = e._dbSchema = u;
                                        const l = rr(s, u);
                                        l.add.forEach((e => {
                                            sr(r, e[0], e[1].primKey, e[1].indexes)
                                        }
                                        )),
                                        l.change.forEach((e => {
                                            if (e.recreate)
                                                throw new Ke.Upgrade("Not yet support for changing primary key");
                                            {
                                                const t = r.objectStore(e.name);
                                                e.add.forEach((e => ir(t, e))),
                                                e.change.forEach((e => {
                                                    t.deleteIndex(e.name),
                                                    ir(t, e)
                                                }
                                                )),
                                                e.del.forEach((e => t.deleteIndex(e)))
                                            }
                                        }
                                        ));
                                        const c = i._cfg.contentUpgrade;
                                        if (c && i._cfg.version > t) {
                                            Zn(e, r),
                                            n._memoizedTables = {},
                                            o = !0;
                                            let t = se(u);
                                            l.del.forEach((e => {
                                                t[e] = s[e]
                                            }
                                            )),
                                            tr(e, [e.Transaction.prototype]),
                                            er(e, [e.Transaction.prototype], F(t), t),
                                            n.schema = t;
                                            const i = ve(c);
                                            let a;
                                            i && Mt();
                                            const h = pt.follow(( () => {
                                                if (a = c(n),
                                                a && i) {
                                                    var e = Ft.bind(null, null);
                                                    a.then(e, e)
                                                }
                                            }
                                            ));
                                            return a && "function" == typeof a.then ? pt.resolve(a) : h.then(( () => a))
                                        }
                                    }
                                    )),
                                    s.push((t => {
                                        var r, s;
                                        o && an || (r = i._cfg.dbschema,
                                        s = t,
                                        [].slice.call(s.db.objectStoreNames).forEach((e => null == r[e] && s.db.deleteObjectStore(e)))),
                                        tr(e, [e.Transaction.prototype]),
                                        er(e, [e.Transaction.prototype], e._storeNames, e._dbSchema),
                                        n.schema = e._dbSchema
                                    }
                                    ))
                                }
                                )),
                                function e() {
                                    return s.length ? pt.resolve(s.shift()(n.idbtrans)).then(e) : pt.resolve()
                                }().then(( () => {
                                    var e, t;
                                    t = r,
                                    F(e = a).forEach((n => {
                                        t.db.objectStoreNames.contains(n) || sr(t, n, e[n].primKey, e[n].indexes)
                                    }
                                    ))
                                }
                                ))
                            }(e, t, i, n).catch(a)
                        }
                        ))
                    }(e, s / 10, a, i)
                }
            }
            ), i),
            l.onsuccess = Pt(( () => {
                a = null;
                const n = e._novip.idbdb = l.result
                  , s = G(n.objectStoreNames);
                if (s.length > 0)
                    try {
                        const r = n.transaction(1 === (i = s).length ? i[0] : i, "readonly");
                        t.autoSchema ? function({_novip: e}, t, n) {
                            e.verno = t.version / 10;
                            const r = e._dbSchema = ar(0, t, n);
                            e._storeNames = G(t.objectStoreNames, 0),
                            er(e, [e._allTables], F(r), r)
                        }(e, n, r) : (or(e, e._dbSchema, r),
                        function(e, t) {
                            const n = rr(ar(0, e.idbdb, t), e._dbSchema);
                            return !(n.add.length || n.change.some((e => e.add.length || e.change.length)))
                        }(e, r) || console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Some queries may fail.")),
                        Zn(e, r)
                    } catch (c) {}
                var i;
                rn.push(e),
                n.onversionchange = Pt((n => {
                    t.vcFired = !0,
                    e.on("versionchange").fire(n)
                }
                )),
                n.onclose = Pt((t => {
                    e.on("close").fire(t)
                }
                )),
                o && function({indexedDB: e, IDBKeyRange: t}, n) {
                    !cr(e) && n !== ln && lr(e, t).put({
                        name: n
                    }).catch(Me)
                }(e._deps, u),
                r()
            }
            ), i)
        }
        )).catch((e => e && "UnknownError" === e.name && t.PR1398_maxLoop > 0 ? (t.PR1398_maxLoop--,
        console.warn("Dexie: Workaround for Chrome UnknownError on open()"),
        u()) : pt.reject(e)));
        return pt.race([r, ("undefined" == typeof navigator ? pt.resolve() : dr()).then(u)]).then(( () => (s(),
        t.onReadyBeingFired = [],
        pt.resolve(hr(( () => e.on.ready.fire(e.vip)))).then((function n() {
            if (t.onReadyBeingFired.length > 0) {
                let r = t.onReadyBeingFired.reduce(Ve, Me);
                return t.onReadyBeingFired = [],
                pt.resolve(hr(( () => r(e.vip)))).then(n)
            }
        }
        ))))).finally(( () => {
            t.onReadyBeingFired = null,
            t.isBeingOpened = !1
        }
        )).then(( () => e)).catch((n => {
            t.dbOpenError = n;
            try {
                a && a.abort()
            } catch (s) {}
            return r === t.openCanceller && e._close(),
            Ht(n)
        }
        )).finally(( () => {
            t.openComplete = !0,
            i()
        }
        ))
    }
    function pr(e) {
        var t = t => e.next(t)
          , n = s(t)
          , r = s((t => e.throw(t)));
        function s(e) {
            return t => {
                var s = e(t)
                  , i = s.value;
                return s.done ? i : i && "function" == typeof i.then ? i.then(n, r) : B(i) ? Promise.all(i).then(n, r) : n(i)
            }
        }
        return s(t)()
    }
    function mr(e, t, n) {
        var r = arguments.length;
        if (r < 2)
            throw new Ke.InvalidArgument("Too few arguments");
        for (var s = new Array(r - 1); --r; )
            s[r - 1] = arguments[r];
        return n = s.pop(),
        [e, ae(s), n]
    }
    function yr(e, t, n, r, s) {
        return pt.resolve().then(( () => {
            const i = ct.transless || ct
              , a = e._createTransaction(t, n, e._dbSchema, r)
              , o = {
                trans: a,
                transless: i
            };
            if (r)
                a.idbtrans = r.idbtrans;
            else
                try {
                    a.create(),
                    e._state.PR1398_maxLoop = 3
                } catch (h) {
                    return h.name === Ae.InvalidState && e.isOpen() && --e._state.PR1398_maxLoop > 0 ? (console.warn("Dexie: Need to reopen db"),
                    e._close(),
                    e.open().then(( () => yr(e, t, n, null, s)))) : Ht(h)
                }
            const u = ve(s);
            let l;
            u && Mt();
            const c = pt.follow(( () => {
                if (l = s.call(a, a),
                l)
                    if (u) {
                        var e = Ft.bind(null, null);
                        l.then(e, e)
                    } else
                        "function" == typeof l.next && "function" == typeof l.throw && (l = pr(l))
            }
            ), o);
            return (l && "function" == typeof l.then ? pt.resolve(l).then((e => a.active ? e : Ht(new Ke.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn")))) : c.then(( () => l))).then((e => (r && a._resolve(),
            a._completion.then(( () => e))))).catch((e => (a._reject(e),
            Ht(e))))
        }
        ))
    }
    function gr(e, t, n) {
        const r = B(e) ? e.slice() : [e];
        for (let s = 0; s < n; ++s)
            r.push(t);
        return r
    }
    const vr = {
        stack: "dbcore",
        name: "VirtualIndexMiddleware",
        level: 1,
        create: function(e) {
            return {
                ...e,
                table(t) {
                    const n = e.table(t)
                      , {schema: r} = n
                      , s = {}
                      , i = [];
                    function a(e, t, n) {
                        const r = Jn(e)
                          , o = s[r] = s[r] || []
                          , u = null == e ? 0 : "string" == typeof e ? 1 : e.length
                          , l = t > 0
                          , c = {
                            ...n,
                            isVirtual: l,
                            keyTail: t,
                            keyLength: u,
                            extractKey: Yn(e),
                            unique: !l && n.unique
                        };
                        return o.push(c),
                        c.isPrimaryKey || i.push(c),
                        u > 1 && a(2 === u ? e[0] : e.slice(0, u - 1), t + 1, n),
                        o.sort(( (e, t) => e.keyTail - t.keyTail)),
                        c
                    }
                    const o = a(r.primaryKey.keyPath, 0, r.primaryKey);
                    s[":id"] = [o];
                    for (const e of r.indexes)
                        a(e.keyPath, 0, e);
                    function u(t) {
                        const n = t.query.index;
                        return n.isVirtual ? {
                            ...t,
                            query: {
                                index: n,
                                range: (r = t.query.range,
                                s = n.keyTail,
                                {
                                    type: 1 === r.type ? 2 : r.type,
                                    lower: gr(r.lower, r.lowerOpen ? e.MAX_KEY : e.MIN_KEY, s),
                                    lowerOpen: !0,
                                    upper: gr(r.upper, r.upperOpen ? e.MIN_KEY : e.MAX_KEY, s),
                                    upperOpen: !0
                                })
                            }
                        } : t;
                        var r, s
                    }
                    return {
                        ...n,
                        schema: {
                            ...r,
                            primaryKey: o,
                            indexes: i,
                            getIndexByKeyPath: function(e) {
                                const t = s[Jn(e)];
                                return t && t[0]
                            }
                        },
                        count: e => n.count(u(e)),
                        query: e => n.query(u(e)),
                        openCursor(t) {
                            const {keyTail: r, isVirtual: s, keyLength: i} = t.query.index;
                            return s ? n.openCursor(u(t)).then((n => {
                                return n && (s = n,
                                Object.create(s, {
                                    continue: {
                                        value: function(n) {
                                            null != n ? s.continue(gr(n, t.reverse ? e.MAX_KEY : e.MIN_KEY, r)) : t.unique ? s.continue(s.key.slice(0, i).concat(t.reverse ? e.MIN_KEY : e.MAX_KEY, r)) : s.continue()
                                        }
                                    },
                                    continuePrimaryKey: {
                                        value(t, n) {
                                            s.continuePrimaryKey(gr(t, e.MAX_KEY, r), n)
                                        }
                                    },
                                    primaryKey: {
                                        get: () => s.primaryKey
                                    },
                                    key: {
                                        get() {
                                            const e = s.key;
                                            return 1 === i ? e[0] : e.slice(0, i)
                                        }
                                    },
                                    value: {
                                        get: () => s.value
                                    }
                                }));
                                var s
                            }
                            )) : n.openCursor(t)
                        }
                    }
                }
            }
        }
    };
    function br(e, t, n, r) {
        return n = n || {},
        r = r || "",
        F(e).forEach((s => {
            if ($(t, s)) {
                var i = e[s]
                  , a = t[s];
                if ("object" == typeof i && "object" == typeof a && i && a) {
                    const e = fe(i);
                    e !== fe(a) ? n[r + s] = t[s] : "Object" === e ? br(i, a, n, r + s + ".") : i !== a && (n[r + s] = t[s])
                } else
                    i !== a && (n[r + s] = t[s])
            } else
                n[r + s] = void 0
        }
        )),
        F(t).forEach((s => {
            $(e, s) || (n[r + s] = t[s])
        }
        )),
        n
    }
    const wr = {
        stack: "dbcore",
        name: "HooksMiddleware",
        level: 2,
        create: e => ({
            ...e,
            table(t) {
                const n = e.table(t)
                  , {primaryKey: r} = n.schema;
                return {
                    ...n,
                    mutate(e) {
                        const s = ct.trans
                          , {deleting: i, creating: a, updating: o} = s.table(t).hook;
                        switch (e.type) {
                        case "add":
                            if (a.fire === Me)
                                break;
                            return s._promise("readwrite", ( () => u(e)), !0);
                        case "put":
                            if (a.fire === Me && o.fire === Me)
                                break;
                            return s._promise("readwrite", ( () => u(e)), !0);
                        case "delete":
                            if (i.fire === Me)
                                break;
                            return s._promise("readwrite", ( () => u(e)), !0);
                        case "deleteRange":
                            if (i.fire === Me)
                                break;
                            return s._promise("readwrite", ( () => {
                                return l((t = e).trans, t.range, 1e4);
                                var t
                            }
                            ), !0)
                        }
                        return n.mutate(e);
                        function u(e) {
                            const t = ct.trans
                              , s = e.keys || (u = r,
                            "delete" === (l = e).type ? l.keys : l.keys || l.values.map(u.extractKey));
                            var u, l;
                            if (!s)
                                throw new Error("Keys missing");
                            return "delete" !== (e = "add" === e.type || "put" === e.type ? {
                                ...e,
                                keys: s
                            } : {
                                ...e
                            }).type && (e.values = [...e.values]),
                            e.keys && (e.keys = [...e.keys]),
                            function(e, t, n) {
                                return "add" === t.type ? Promise.resolve([]) : e.getMany({
                                    trans: t.trans,
                                    keys: n,
                                    cache: "immutable"
                                })
                            }(n, e, s).then((u => {
                                const l = s.map(( (n, s) => {
                                    const l = u[s]
                                      , c = {
                                        onerror: null,
                                        onsuccess: null
                                    };
                                    if ("delete" === e.type)
                                        i.fire.call(c, n, l, t);
                                    else if ("add" === e.type || void 0 === l) {
                                        const i = a.fire.call(c, n, e.values[s], t);
                                        null == n && null != i && (n = i,
                                        e.keys[s] = n,
                                        r.outbound || re(e.values[s], r.keyPath, n))
                                    } else {
                                        const r = br(l, e.values[s])
                                          , i = o.fire.call(c, r, n, l, t);
                                        if (i) {
                                            const t = e.values[s];
                                            Object.keys(i).forEach((e => {
                                                $(t, e) ? t[e] = i[e] : re(t, e, i[e])
                                            }
                                            ))
                                        }
                                    }
                                    return c
                                }
                                ));
                                return n.mutate(e).then(( ({failures: t, results: n, numFailures: r, lastResult: i}) => {
                                    for (let a = 0; a < s.length; ++a) {
                                        const r = n ? n[a] : s[a]
                                          , i = l[a];
                                        null == r ? i.onerror && i.onerror(t[a]) : i.onsuccess && i.onsuccess("put" === e.type && u[a] ? e.values[a] : r)
                                    }
                                    return {
                                        failures: t,
                                        results: n,
                                        numFailures: r,
                                        lastResult: i
                                    }
                                }
                                )).catch((e => (l.forEach((t => t.onerror && t.onerror(e))),
                                Promise.reject(e))))
                            }
                            ))
                        }
                        function l(e, t, s) {
                            return n.query({
                                trans: e,
                                values: !1,
                                query: {
                                    index: r,
                                    range: t
                                },
                                limit: s
                            }).then(( ({result: n}) => u({
                                type: "delete",
                                keys: n,
                                trans: e
                            }).then((r => r.numFailures > 0 ? Promise.reject(r.failures[0]) : n.length < s ? {
                                failures: [],
                                numFailures: 0,
                                lastResult: void 0
                            } : l(e, {
                                ...t,
                                lower: n[n.length - 1],
                                lowerOpen: !0
                            }, s)))))
                        }
                    }
                }
            }
        })
    };
    function _r(e, t, n) {
        try {
            if (!t)
                return null;
            if (t.keys.length < e.length)
                return null;
            const r = [];
            for (let s = 0, i = 0; s < t.keys.length && i < e.length; ++s)
                0 === Sn(t.keys[s], e[i]) && (r.push(n ? ce(t.values[s]) : t.values[s]),
                ++i);
            return r.length === e.length ? r : null
        } catch (r) {
            return null
        }
    }
    const kr = {
        stack: "dbcore",
        level: -1,
        create: e => ({
            table: t => {
                const n = e.table(t);
                return {
                    ...n,
                    getMany: e => {
                        if (!e.cache)
                            return n.getMany(e);
                        const t = _r(e.keys, e.trans._cache, "clone" === e.cache);
                        return t ? pt.resolve(t) : n.getMany(e).then((t => (e.trans._cache = {
                            keys: e.keys,
                            values: "clone" === e.cache ? ce(t) : t
                        },
                        t)))
                    }
                    ,
                    mutate: e => ("add" !== e.type && (e.trans._cache = null),
                    n.mutate(e))
                }
            }
        })
    };
    function xr(e) {
        return !("from"in e)
    }
    const Er = function(e, t) {
        if (!this) {
            const t = new Er;
            return e && "d"in e && N(t, e),
            t
        }
        N(this, arguments.length ? {
            d: 1,
            from: e,
            to: arguments.length > 1 ? t : e
        } : {
            d: 0
        })
    };
    function Sr(e, t, n) {
        const r = Sn(t, n);
        if (isNaN(r))
            return;
        if (r > 0)
            throw RangeError();
        if (xr(e))
            return N(e, {
                from: t,
                to: n,
                d: 1
            });
        const s = e.l
          , i = e.r;
        if (Sn(n, e.from) < 0)
            return s ? Sr(s, t, n) : e.l = {
                from: t,
                to: n,
                d: 1,
                l: null,
                r: null
            },
            Ir(e);
        if (Sn(t, e.to) > 0)
            return i ? Sr(i, t, n) : e.r = {
                from: t,
                to: n,
                d: 1,
                l: null,
                r: null
            },
            Ir(e);
        Sn(t, e.from) < 0 && (e.from = t,
        e.l = null,
        e.d = i ? i.d + 1 : 1),
        Sn(n, e.to) > 0 && (e.to = n,
        e.r = null,
        e.d = e.l ? e.l.d + 1 : 1);
        const a = !e.r;
        s && !e.l && qr(e, s),
        i && a && qr(e, i)
    }
    function qr(e, t) {
        xr(t) || function e(t, {from: n, to: r, l: s, r: i}) {
            Sr(t, n, r),
            s && e(t, s),
            i && e(t, i)
        }(e, t)
    }
    function Tr(e) {
        let t = xr(e) ? null : {
            s: 0,
            n: e
        };
        return {
            next(e) {
                const n = arguments.length > 0;
                for (; t; )
                    switch (t.s) {
                    case 0:
                        if (t.s = 1,
                        n)
                            for (; t.n.l && Sn(e, t.n.from) < 0; )
                                t = {
                                    up: t,
                                    n: t.n.l,
                                    s: 1
                                };
                        else
                            for (; t.n.l; )
                                t = {
                                    up: t,
                                    n: t.n.l,
                                    s: 1
                                };
                    case 1:
                        if (t.s = 2,
                        !n || Sn(e, t.n.to) <= 0)
                            return {
                                value: t.n,
                                done: !1
                            };
                    case 2:
                        if (t.n.r) {
                            t.s = 3,
                            t = {
                                up: t,
                                n: t.n.r,
                                s: 0
                            };
                            continue
                        }
                    case 3:
                        t = t.up
                    }
                return {
                    done: !0
                }
            }
        }
    }
    function Ir(e) {
        var t, n;
        const r = ((null === (t = e.r) || void 0 === t ? void 0 : t.d) || 0) - ((null === (n = e.l) || void 0 === n ? void 0 : n.d) || 0)
          , s = r > 1 ? "r" : r < -1 ? "l" : "";
        if (s) {
            const t = "r" === s ? "l" : "r"
              , n = {
                ...e
            }
              , r = e[s];
            e.from = r.from,
            e.to = r.to,
            e[s] = r[s],
            n[s] = r[t],
            e[t] = n,
            n.d = Pr(n)
        }
        e.d = Pr(e)
    }
    function Pr({r: e, l: t}) {
        return (e ? t ? Math.max(e.d, t.d) : e.d : t ? t.d : 0) + 1
    }
    W(Er.prototype, {
        add(e) {
            return qr(this, e),
            this
        },
        addKey(e) {
            return Sr(this, e, e),
            this
        },
        addKeys(e) {
            return e.forEach((e => Sr(this, e, e))),
            this
        },
        [pe]() {
            return Tr(this)
        }
    });
    const Cr = {
        stack: "dbcore",
        level: 0,
        create: e => {
            const t = e.schema.name
              , n = new Er(e.MIN_KEY,e.MAX_KEY);
            return {
                ...e,
                table: r => {
                    const s = e.table(r)
                      , {schema: i} = s
                      , {primaryKey: a} = i
                      , {extractKey: o, outbound: u} = a
                      , l = {
                        ...s,
                        mutate: e => {
                            const a = e.trans
                              , o = a.mutatedParts || (a.mutatedParts = {})
                              , u = e => {
                                const n = `idb://${t}/${r}/${e}`;
                                return o[n] || (o[n] = new Er)
                            }
                              , l = u("")
                              , c = u(":dels")
                              , {type: h} = e;
                            let[d,f] = "deleteRange" === e.type ? [e.range] : "delete" === e.type ? [e.keys] : e.values.length < 50 ? [[], e.values] : [];
                            const p = e.trans._cache;
                            return s.mutate(e).then((e => {
                                if (B(d)) {
                                    "delete" !== h && (d = e.results),
                                    l.addKeys(d);
                                    const n = _r(d, p);
                                    n || "add" === h || c.addKeys(d),
                                    (n || f) && (t = u,
                                    r = n,
                                    s = f,
                                    i.indexes.forEach((function(e) {
                                        const n = t(e.name || "");
                                        function i(t) {
                                            return null != t ? e.extractKey(t) : null
                                        }
                                        const a = t => e.multiEntry && B(t) ? t.forEach((e => n.addKey(e))) : n.addKey(t);
                                        (r || s).forEach(( (e, t) => {
                                            const n = r && i(r[t])
                                              , o = s && i(s[t]);
                                            0 !== Sn(n, o) && (null != n && a(n),
                                            null != o && a(o))
                                        }
                                        ))
                                    }
                                    )))
                                } else if (d) {
                                    const e = {
                                        from: d.lower,
                                        to: d.upper
                                    };
                                    c.add(e),
                                    l.add(e)
                                } else
                                    l.add(n),
                                    c.add(n),
                                    i.indexes.forEach((e => u(e.name).add(n)));
                                var t, r, s;
                                return e
                            }
                            ))
                        }
                    }
                      , c = ({query: {index: t, range: n}}) => {
                        var r, s;
                        return [t, new Er(null !== (r = n.lower) && void 0 !== r ? r : e.MIN_KEY,null !== (s = n.upper) && void 0 !== s ? s : e.MAX_KEY)]
                    }
                      , h = {
                        get: e => [a, new Er(e.key)],
                        getMany: e => [a, (new Er).addKeys(e.keys)],
                        count: c,
                        query: c,
                        openCursor: c
                    };
                    return F(h).forEach((e => {
                        l[e] = function(i) {
                            const {subscr: a} = ct;
                            if (a) {
                                const l = e => {
                                    const n = `idb://${t}/${r}/${e}`;
                                    return a[n] || (a[n] = new Er)
                                }
                                  , c = l("")
                                  , d = l(":dels")
                                  , [f,p] = h[e](i);
                                if (l(f.name || "").add(p),
                                !f.isPrimaryKey) {
                                    if ("count" !== e) {
                                        const t = "query" === e && u && i.values && s.query({
                                            ...i,
                                            values: !1
                                        });
                                        return s[e].apply(this, arguments).then((n => {
                                            if ("query" === e) {
                                                if (u && i.values)
                                                    return t.then(( ({result: e}) => (c.addKeys(e),
                                                    n)));
                                                const e = i.values ? n.result.map(o) : n.result;
                                                i.values ? c.addKeys(e) : d.addKeys(e)
                                            } else if ("openCursor" === e) {
                                                const e = n
                                                  , t = i.values;
                                                return e && Object.create(e, {
                                                    key: {
                                                        get: () => (d.addKey(e.primaryKey),
                                                        e.key)
                                                    },
                                                    primaryKey: {
                                                        get() {
                                                            const t = e.primaryKey;
                                                            return d.addKey(t),
                                                            t
                                                        }
                                                    },
                                                    value: {
                                                        get: () => (t && c.addKey(e.primaryKey),
                                                        e.value)
                                                    }
                                                })
                                            }
                                            return n
                                        }
                                        ))
                                    }
                                    d.add(n)
                                }
                            }
                            return s[e].apply(this, arguments)
                        }
                    }
                    )),
                    l
                }
            }
        }
    };
    class Rr {
        constructor(e, t) {
            this._middlewares = {},
            this.verno = 0;
            const n = Rr.dependencies;
            this._options = t = {
                addons: Rr.addons,
                autoOpen: !0,
                indexedDB: n.indexedDB,
                IDBKeyRange: n.IDBKeyRange,
                ...t
            },
            this._deps = {
                indexedDB: t.indexedDB,
                IDBKeyRange: t.IDBKeyRange
            };
            const {addons: r} = t;
            this._dbSchema = {},
            this._versions = [],
            this._storeNames = [],
            this._allTables = {},
            this.idbdb = null,
            this._novip = this;
            const s = {
                dbOpenError: null,
                isBeingOpened: !1,
                onReadyBeingFired: null,
                openComplete: !1,
                dbReadyResolve: Me,
                dbReadyPromise: null,
                cancelOpen: Me,
                openCanceller: null,
                autoSchema: !0,
                PR1398_maxLoop: 3
            };
            var i, a;
            s.dbReadyPromise = new pt((e => {
                s.dbReadyResolve = e
            }
            )),
            s.openCanceller = new pt(( (e, t) => {
                s.cancelOpen = t
            }
            )),
            this._state = s,
            this.name = e,
            this.on = yn(this, "populate", "blocked", "versionchange", "close", {
                ready: [Ve, Me]
            }),
            this.on.ready.subscribe = J(this.on.ready.subscribe, (e => (t, n) => {
                Rr.vip(( () => {
                    const r = this._state;
                    if (r.openComplete)
                        r.dbOpenError || pt.resolve().then(t),
                        n && e(t);
                    else if (r.onReadyBeingFired)
                        r.onReadyBeingFired.push(t),
                        n && e(t);
                    else {
                        e(t);
                        const r = this;
                        n || e((function e() {
                            r.on.ready.unsubscribe(t),
                            r.on.ready.unsubscribe(e)
                        }
                        ))
                    }
                }
                ))
            }
            )),
            this.Collection = (i = this,
            gn(In.prototype, (function(e, t) {
                this.db = i;
                let n = fn
                  , r = null;
                if (t)
                    try {
                        n = t()
                    } catch (u) {
                        r = u
                    }
                const s = e._ctx
                  , a = s.table
                  , o = a.hook.reading.fire;
                this._ctx = {
                    table: a,
                    index: s.index,
                    isPrimKey: !s.index || a.schema.primKey.keyPath && s.index === a.schema.primKey.name,
                    range: n,
                    keysOnly: !1,
                    dir: "next",
                    unique: "",
                    algorithm: null,
                    filter: null,
                    replayFilter: null,
                    justLimit: !0,
                    isMatch: null,
                    offset: 0,
                    limit: 1 / 0,
                    error: r,
                    or: s.or,
                    valueMapper: o !== Fe ? o : null
                }
            }
            ))),
            this.Table = (a = this,
            gn(mn.prototype, (function(e, t, n) {
                this.db = a,
                this._tx = n,
                this.name = e,
                this.schema = t,
                this.hook = a._allTables[e] ? a._allTables[e].hook : yn(null, {
                    creating: [Ue, Me],
                    reading: [Be, Fe],
                    updating: [$e, Me],
                    deleting: [Le, Me]
                })
            }
            ))),
            this.Transaction = function(e) {
                return gn(Wn.prototype, (function(t, n, r, s, i) {
                    this.db = e,
                    this.mode = t,
                    this.storeNames = n,
                    this.schema = r,
                    this.chromeTransactionDurability = s,
                    this.idbtrans = null,
                    this.on = yn(this, "complete", "error", "abort"),
                    this.parent = i || null,
                    this.active = !0,
                    this._reculock = 0,
                    this._blockedFuncs = [],
                    this._resolve = null,
                    this._reject = null,
                    this._waitingFor = null,
                    this._waitingQueue = null,
                    this._spinCount = 0,
                    this._completion = new pt(( (e, t) => {
                        this._resolve = e,
                        this._reject = t
                    }
                    )),
                    this._completion.then(( () => {
                        this.active = !1,
                        this.on.complete.fire()
                    }
                    ), (e => {
                        var t = this.active;
                        return this.active = !1,
                        this.on.error.fire(e),
                        this.parent ? this.parent._reject(e) : t && this.idbtrans && this.idbtrans.abort(),
                        Ht(e)
                    }
                    ))
                }
                ))
            }(this),
            this.Version = function(e) {
                return gn(ur.prototype, (function(t) {
                    this.db = e,
                    this._cfg = {
                        version: t,
                        storesSource: null,
                        dbschema: {},
                        tables: {},
                        contentUpgrade: null
                    }
                }
                ))
            }(this),
            this.WhereClause = function(e) {
                return gn(Fn.prototype, (function(t, n, r) {
                    this.db = e,
                    this._ctx = {
                        table: t,
                        index: ":id" === n ? null : n,
                        or: r
                    };
                    const s = e._deps.indexedDB;
                    if (!s)
                        throw new Ke.MissingAPI;
                    this._cmp = this._ascending = s.cmp.bind(s),
                    this._descending = (e, t) => s.cmp(t, e),
                    this._max = (e, t) => s.cmp(e, t) > 0 ? e : t,
                    this._min = (e, t) => s.cmp(e, t) < 0 ? e : t,
                    this._IDBKeyRange = e._deps.IDBKeyRange
                }
                ))
            }(this),
            this.on("versionchange", (e => {
                e.newVersion > 0 ? console.warn(`Another connection wants to upgrade database '${this.name}'. Closing db now to resume the upgrade.`) : console.warn(`Another connection wants to delete database '${this.name}'. Closing db now to resume the delete request.`),
                this.close()
            }
            )),
            this.on("blocked", (e => {
                !e.newVersion || e.newVersion < e.oldVersion ? console.warn(`Dexie.delete('${this.name}') was blocked`) : console.warn(`Upgrade '${this.name}' blocked by other connection holding version ${e.oldVersion / 10}`)
            }
            )),
            this._maxKey = Xn(t.IDBKeyRange),
            this._createTransaction = (e, t, n, r) => new this.Transaction(e,t,n,this._options.chromeTransactionDurability,r),
            this._fireOnBlocked = e => {
                this.on("blocked").fire(e),
                rn.filter((e => e.name === this.name && e !== this && !e._state.vcFired)).map((t => t.on("versionchange").fire(e)))
            }
            ,
            this.use(vr),
            this.use(wr),
            this.use(Cr),
            this.use(kr),
            this.vip = Object.create(this, {
                _vip: {
                    value: !0
                }
            }),
            r.forEach((e => e(this)))
        }
        version(e) {
            if (isNaN(e) || e < .1)
                throw new Ke.Type("Given version is not a positive number");
            if (e = Math.round(10 * e) / 10,
            this.idbdb || this._state.isBeingOpened)
                throw new Ke.Schema("Cannot add version when database is open");
            this.verno = Math.max(this.verno, e);
            const t = this._versions;
            var n = t.filter((t => t._cfg.version === e))[0];
            return n || (n = new this.Version(e),
            t.push(n),
            t.sort(nr),
            n.stores({}),
            this._state.autoSchema = !1,
            n)
        }
        _whenReady(e) {
            return this.idbdb && (this._state.openComplete || ct.letThrough || this._vip) ? e() : new pt(( (e, t) => {
                if (this._state.openComplete)
                    return t(new Ke.DatabaseClosed(this._state.dbOpenError));
                if (!this._state.isBeingOpened) {
                    if (!this._options.autoOpen)
                        return void t(new Ke.DatabaseClosed);
                    this.open().catch(Me)
                }
                this._state.dbReadyPromise.then(e, t)
            }
            )).then(e)
        }
        use({stack: e, create: t, level: n, name: r}) {
            r && this.unuse({
                stack: e,
                name: r
            });
            const s = this._middlewares[e] || (this._middlewares[e] = []);
            return s.push({
                stack: e,
                create: t,
                level: null == n ? 10 : n,
                name: r
            }),
            s.sort(( (e, t) => e.level - t.level)),
            this
        }
        unuse({stack: e, name: t, create: n}) {
            return e && this._middlewares[e] && (this._middlewares[e] = this._middlewares[e].filter((e => n ? e.create !== n : !!t && e.name !== t))),
            this
        }
        open() {
            return fr(this)
        }
        _close() {
            const e = this._state
              , t = rn.indexOf(this);
            if (t >= 0 && rn.splice(t, 1),
            this.idbdb) {
                try {
                    this.idbdb.close()
                } catch (n) {}
                this._novip.idbdb = null
            }
            e.dbReadyPromise = new pt((t => {
                e.dbReadyResolve = t
            }
            )),
            e.openCanceller = new pt(( (t, n) => {
                e.cancelOpen = n
            }
            ))
        }
        close() {
            this._close();
            const e = this._state;
            this._options.autoOpen = !1,
            e.dbOpenError = new Ke.DatabaseClosed,
            e.isBeingOpened && e.cancelOpen(e.dbOpenError)
        }
        delete() {
            const e = arguments.length > 0
              , t = this._state;
            return new pt(( (n, r) => {
                const s = () => {
                    this.close();
                    var e = this._deps.indexedDB.deleteDatabase(this.name);
                    e.onsuccess = Pt(( () => {
                        !function({indexedDB: e, IDBKeyRange: t}, n) {
                            !cr(e) && n !== ln && lr(e, t).delete(n).catch(Me)
                        }(this._deps, this.name),
                        n()
                    }
                    )),
                    e.onerror = Bn(r),
                    e.onblocked = this._fireOnBlocked
                }
                ;
                if (e)
                    throw new Ke.InvalidArgument("Arguments not allowed in db.delete()");
                t.isBeingOpened ? t.dbReadyPromise.then(s) : s()
            }
            ))
        }
        backendDB() {
            return this.idbdb
        }
        isOpen() {
            return null !== this.idbdb
        }
        hasBeenClosed() {
            const e = this._state.dbOpenError;
            return e && "DatabaseClosed" === e.name
        }
        hasFailed() {
            return null !== this._state.dbOpenError
        }
        dynamicallyOpened() {
            return this._state.autoSchema
        }
        get tables() {
            return F(this._allTables).map((e => this._allTables[e]))
        }
        transaction() {
            const e = mr.apply(this, arguments);
            return this._transaction.apply(this, e)
        }
        _transaction(e, t, n) {
            let r = ct.trans;
            r && r.db === this && -1 === e.indexOf("!") || (r = null);
            const s = -1 !== e.indexOf("?");
            let i, a;
            e = e.replace("!", "").replace("?", "");
            try {
                if (a = t.map((e => {
                    var t = e instanceof this.Table ? e.name : e;
                    if ("string" != typeof t)
                        throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
                    return t
                }
                )),
                "r" == e || e === cn)
                    i = cn;
                else {
                    if ("rw" != e && e != hn)
                        throw new Ke.InvalidArgument("Invalid transaction mode: " + e);
                    i = hn
                }
                if (r) {
                    if (r.mode === cn && i === hn) {
                        if (!s)
                            throw new Ke.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
                        r = null
                    }
                    r && a.forEach((e => {
                        if (r && -1 === r.storeNames.indexOf(e)) {
                            if (!s)
                                throw new Ke.SubTransaction("Table " + e + " not included in parent transaction.");
                            r = null
                        }
                    }
                    )),
                    s && r && !r.active && (r = null)
                }
            } catch (u) {
                return r ? r._promise(null, ( (e, t) => {
                    t(u)
                }
                )) : Ht(u)
            }
            const o = yr.bind(null, this, i, a, r, n);
            return r ? r._promise(i, o, "lock") : ct.trans ? Wt(ct.transless, ( () => this._whenReady(o))) : this._whenReady(o)
        }
        table(e) {
            if (!$(this._allTables, e))
                throw new Ke.InvalidTable(`Table ${e} does not exist`);
            return this._allTables[e]
        }
    }
    const Ar = "undefined" != typeof Symbol && "observable"in Symbol ? Symbol.observable : "@@observable";
    class Or {
        constructor(e) {
            this._subscribe = e
        }
        subscribe(e, t, n) {
            return this._subscribe(e && "function" != typeof e ? e : {
                next: e,
                error: t,
                complete: n
            })
        }
        [Ar]() {
            return this
        }
    }
    function Kr(e, t) {
        return F(t).forEach((n => {
            qr(e[n] || (e[n] = new Er), t[n])
        }
        )),
        e
    }
    let Dr;
    try {
        Dr = {
            indexedDB: M.indexedDB || M.mozIndexedDB || M.webkitIndexedDB || M.msIndexedDB,
            IDBKeyRange: M.IDBKeyRange || M.webkitIDBKeyRange
        }
    } catch (Is) {
        Dr = {
            indexedDB: null,
            IDBKeyRange: null
        }
    }
    const jr = Rr;
    function Mr(e) {
        let t = Fr;
        try {
            Fr = !0,
            $n.storagemutated.fire(e)
        } finally {
            Fr = t
        }
    }
    W(jr, {
        ...je,
        delete: e => new jr(e,{
            addons: []
        }).delete(),
        exists: e => new jr(e,{
            addons: []
        }).open().then((e => (e.close(),
        !0))).catch("NoSuchDatabaseError", ( () => !1)),
        getDatabaseNames(e) {
            try {
                return function({indexedDB: e, IDBKeyRange: t}) {
                    return cr(e) ? Promise.resolve(e.databases()).then((e => e.map((e => e.name)).filter((e => e !== ln)))) : lr(e, t).toCollection().primaryKeys()
                }(jr.dependencies).then(e)
            } catch (t) {
                return Ht(new Ke.MissingAPI)
            }
        },
        defineClass: () => function(e) {
            N(this, e)
        }
        ,
        ignoreTransaction: e => ct.trans ? Wt(ct.transless, e) : e(),
        vip: hr,
        async: function(e) {
            return function() {
                try {
                    var t = pr(e.apply(this, arguments));
                    return t && "function" == typeof t.then ? t : pt.resolve(t)
                } catch (n) {
                    return Ht(n)
                }
            }
        },
        spawn: function(e, t, n) {
            try {
                var r = pr(e.apply(n, t || []));
                return r && "function" == typeof r.then ? r : pt.resolve(r)
            } catch (s) {
                return Ht(s)
            }
        },
        currentTransaction: {
            get: () => ct.trans || null
        },
        waitFor: function(e, t) {
            const n = pt.resolve("function" == typeof e ? jr.ignoreTransaction(e) : e).timeout(t || 6e4);
            return ct.trans ? ct.trans.waitFor(n) : n
        },
        Promise: pt,
        debug: {
            get: () => be,
            set: e => {
                we(e, "dexie" === e ? () => !0 : un)
            }
        },
        derive: z,
        extend: N,
        props: W,
        override: J,
        Events: yn,
        on: $n,
        liveQuery: function(e) {
            let t, n = !1;
            const r = new Or((r => {
                const s = ve(e);
                let i = !1
                  , a = {}
                  , o = {};
                const u = {
                    get closed() {
                        return i
                    },
                    unsubscribe: () => {
                        i = !0,
                        $n.storagemutated.unsubscribe(d)
                    }
                };
                r.start && r.start(u);
                let l = !1
                  , c = !1;
                function h() {
                    return F(o).some((e => a[e] && function(e, t) {
                        const n = Tr(t);
                        let r = n.next();
                        if (r.done)
                            return !1;
                        let s = r.value;
                        const i = Tr(e);
                        let a = i.next(s.from)
                          , o = a.value;
                        for (; !r.done && !a.done; ) {
                            if (Sn(o.from, s.to) <= 0 && Sn(o.to, s.from) >= 0)
                                return !0;
                            Sn(s.from, o.from) < 0 ? s = (r = n.next(o.from)).value : o = (a = i.next(s.from)).value
                        }
                        return !1
                    }(a[e], o[e])))
                }
                const d = e => {
                    Kr(a, e),
                    h() && f()
                }
                  , f = () => {
                    if (l || i)
                        return;
                    a = {};
                    const p = {}
                      , m = function(t) {
                        s && Mt();
                        const n = () => jt(e, {
                            subscr: t,
                            trans: null
                        })
                          , r = ct.trans ? Wt(ct.transless, n) : n();
                        return s && r.then(Ft, Ft),
                        r
                    }(p);
                    c || ($n(Un, d),
                    c = !0),
                    l = !0,
                    Promise.resolve(m).then((e => {
                        n = !0,
                        t = e,
                        l = !1,
                        i || (h() ? f() : (a = {},
                        o = p,
                        r.next && r.next(e)))
                    }
                    ), (e => {
                        l = !1,
                        n = !1,
                        r.error && r.error(e),
                        u.unsubscribe()
                    }
                    ))
                }
                ;
                return f(),
                u
            }
            ));
            return r.hasValue = () => n,
            r.getValue = () => t,
            r
        },
        extendObservabilitySet: Kr,
        getByKeyPath: ne,
        setByKeyPath: re,
        delByKeyPath: function(e, t) {
            "string" == typeof t ? re(e, t, void 0) : "length"in t && [].map.call(t, (function(t) {
                re(e, t, void 0)
            }
            ))
        },
        shallowClone: se,
        deepClone: ce,
        getObjectDiff: br,
        cmp: Sn,
        asap: ee,
        minKey: en,
        addons: [],
        connections: rn,
        errnames: Ae,
        dependencies: Dr,
        semVer: Jt,
        version: Jt.split(".").map((e => parseInt(e))).reduce(( (e, t, n) => e + t / Math.pow(10, 2 * n)))
    }),
    jr.maxKey = Xn(jr.dependencies.IDBKeyRange),
    "undefined" != typeof dispatchEvent && "undefined" != typeof addEventListener && ($n(Un, (e => {
        if (!Fr) {
            let t;
            sn ? (t = document.createEvent("CustomEvent"),
            t.initCustomEvent(Ln, !0, !0, e)) : t = new CustomEvent(Ln,{
                detail: e
            }),
            Fr = !0,
            dispatchEvent(t),
            Fr = !1
        }
    }
    )),
    addEventListener(Ln, ( ({detail: e}) => {
        Fr || Mr(e)
    }
    )));
    let Fr = !1;
    if ("undefined" != typeof BroadcastChannel) {
        const e = new BroadcastChannel(Ln);
        "function" == typeof e.unref && e.unref(),
        $n(Un, (t => {
            Fr || e.postMessage(t)
        }
        )),
        e.onmessage = e => {
            e.data && Mr(e.data)
        }
    } else if ("undefined" != typeof self && "undefined" != typeof navigator) {
        $n(Un, (e => {
            try {
                Fr || ("undefined" != typeof localStorage && localStorage.setItem(Ln, JSON.stringify({
                    trig: Math.random(),
                    changedParts: e
                })),
                "object" == typeof self.clients && [...self.clients.matchAll({
                    includeUncontrolled: !0
                })].forEach((t => t.postMessage({
                    type: Ln,
                    changedParts: e
                }))))
            } catch (t) {}
        }
        )),
        "undefined" != typeof addEventListener && addEventListener("storage", (e => {
            if (e.key === Ln) {
                const t = JSON.parse(e.newValue);
                t && Mr(t.changedParts)
            }
        }
        ));
        const e = self.document && navigator.serviceWorker;
        e && e.addEventListener("message", (function({data: e}) {
            e && e.type === Ln && Mr(e.changedParts)
        }
        ))
    }
    pt.rejectionMapper = function(e, t) {
        if (!e || e instanceof Ie || e instanceof TypeError || e instanceof SyntaxError || !e.name || !De[e.name])
            return e;
        var n = new De[e.name](t || e.message,e);
        return "stack"in e && Q(n, "stack", {
            get: function() {
                return this.inner.stack
            }
        }),
        n
    }
    ,
    we(be, un);
    const Br = {}
      , Nr = {
        data: "id"
    }
      , Ur = new class {
        constructor() {
            this.dbs = new Proxy(Br,{
                get: (e, t) => (e[t = "syncedDb:" + t] && e[t].isOpen() || (e[t] = new Rr(t),
                e[t].version(1).stores(Nr)),
                e[t].data)
            })
        }
        async refresh(e, t) {
            await this.dbs[e].clear(),
            await this.dbs[e].bulkAdd(t)
        }
        get(e) {
            return this.dbs[e].toArray()
        }
        getById(e, t) {
            return this.dbs[e].get(t)
        }
        create(e, t, n) {
            return this.dbs[e].add({
                id: t,
                ...n
            }, t)
        }
        async update(e, t, n) {
            const r = await this.dbs[e].update(t, n);
            return 0 === r ? this.create(e, t, n) : r
        }
        delete(e, t) {
            return this.dbs[e].delete(t)
        }
    }
      , Lr = new class {
        get ids() {
            return this.db && this.db.isOpen() || (this.db = new Rr("idMap"),
            this.db.version(1).stores({
                ids: "sid,&cid"
            })),
            this.db.ids
        }
        async getCid(e) {
            const t = await this.ids.get(e);
            if (t)
                return t.cid;
            throw new Error("No matching cid found")
        }
        async getSid(e) {
            const t = await this.ids.get({
                cid: e
            });
            if (t)
                return t.sid;
            throw new Error("No matching sid found")
        }
        async checkCidExists(e) {
            try {
                return !!(await this.getSid(e))
            } catch (Is) {
                return !1
            }
        }
        set({cid: e, sid: t}) {
            return this.ids.add({
                cid: e,
                sid: t
            })
        }
        convertDataArrayToServerIds(e) {
            return this._convertDataArrayIds("cid", e)
        }
        convertDataArrayToClientIds(e) {
            return this._convertDataArrayIds("sid", e)
        }
        convertDataToServerIds(e) {
            return this._convertDataIds("cid", e)
        }
        convertDataToClientIds(e) {
            return this._convertDataIds("sid", e)
        }
        async _convertDataArrayIds(e, t) {
            const n = [];
            for (const r of t)
                n.push(await this._convertDataIds(e, r));
            return n
        }
        async _convertDataIds(e, t) {
            const n = {}
              , r = "cid" === e ? "sid" : "cid"
              , s = async t => {
                "string" != typeof t && ( () => {
                    throw new Error(`idMap attempted conversion to ${r} but property was not string`)
                }
                )();
                const n = await this.ids.where({
                    [e]: t
                }).first();
                return n || await this.set({
                    cid: t,
                    sid: t
                }),
                (null == n ? void 0 : n[r]) || t
            }
            ;
            return await Promise.all(Object.entries(t).map((async ([e,t]) => {
                this._propertyRequiresIdConversion(e, t) ? Array.isArray(t) ? n[e] = await Promise.all(t.map(s)) : "string" == typeof t && (n[e] = await s(t)) : n[e] = t
            }
            ))),
            n
        }
        _propertyRequiresIdConversion(e, t) {
            return "number" != typeof t && (["id", "ids"].includes(e) || e.endsWith("Id") || e.endsWith("Ids"))
        }
    }
    ;
    var $r = (e => (e.Sync = "sync",
    e.Cache = "cache",
    e.Server = "server",
    e.Timestamp = "timestamp",
    e.TimestampStrict = "timestamp:strict",
    e))($r || {});
    const Wr = e => {
        let t = () => {}
        ;
        const n = new Promise(( (n, r) => {
            const s = setTimeout(n, e);
            t = e => {
                clearTimeout(s),
                r(e)
            }
        }
        ));
        return {
            clear: t,
            delay: n
        }
    }
      , Vr = "notification-alarm";
    let Qr;
    const zr = globalThis.chrome || globalThis.browser || {}
      , Xr = () => (Qr && Qr.isOpen() || (Qr = new Rr("notificationsQueue"),
    Qr.version(1).stores({
        queue: "id,time,type"
    })),
    Qr.table("queue"))
      , Yr = async e => {
        await os(e.exclusiveWith),
        await Xr().put(e),
        await Zr()
    }
      , Hr = async e => {
        await os(e),
        await Zr()
    }
      , Gr = async e => {
        await Xr().where("type").equals(e).delete(),
        await Zr()
    }
    ;
    let Jr;
    const Zr = async () => {
        const e = await is();
        if (!e)
            return;
        if (!("notifications"in zr))
            return;
        if (!("alarms"in zr))
            return;
        await zr.alarms.get(Vr) && await zr.alarms.clear(Vr),
        zr.alarms.onAlarm.removeListener(es);
        const t = Math.max(e.time - 2e3, Date.now());
        if (t <= Date.now() + 3e4) {
            null == Jr || Jr("handled");
            const {delay: e, clear: n} = Wr(t - Date.now());
            Jr = n;
            let r = !1;
            if (await e.catch((e => {
                if ("handled" !== e)
                    throw e;
                r = !0
            }
            )),
            r)
                return;
            await ts()
        } else
            zr.alarms.onAlarm.addListener(es),
            await zr.alarms.create(Vr, {
                when: t
            })
    }
      , es = e => {
        e.name === Vr && ts()
    }
      , ts = async () => {
        zr.notifications.onClicked.removeListener(ns),
        zr.notifications.onButtonClicked.removeListener(rs),
        zr.notifications.onClicked.addListener(ns),
        zr.notifications.onButtonClicked.addListener(rs);
        for (const e of await as()) {
            for (const t of e.exclusiveWith)
                await zr.notifications.clear(t);
            await Wr(2e3).delay,
            await zr.notifications.create(e.id, e.notification),
            await os(e.id)
        }
        await Zr()
    }
      , ns = e => {
        (async () => {
            (await (async () => {
                const e = globalThis.browser;
                if (chrome && chrome.runtime && chrome.runtime.getContexts)
                    return (await chrome.runtime.getContexts({
                        contextTypes: [chrome.runtime.ContextType.TAB]
                    })).map((e => ({
                        id: `${e.tabId}`
                    })));
                if (e && e.tabs) {
                    const t = await e.tabs.query({})
                      , n = location.origin;
                    return t.filter((e => {
                        var t;
                        return null == (t = e.url) ? void 0 : t.startsWith(n)
                    }
                    )).map((e => ({
                        id: `${e.id}`
                    })))
                }
                {
                    const e = self;
                    return (await e.clients.matchAll()).map((e => ({
                        id: e.id
                    })))
                }
            }
            )()).length ? ss(e) : await zr.tabs.create({
                url: "index.html?notificationClick=" + e
            }),
            await zr.notifications.clear(e)
        }
        )()
    }
      , rs = (e, t) => {
        ns(e + "_" + t)
    }
      , ss = e => {
        self.bus.sendToAllTabs({
            msgId: "notificationClick",
            response: e
        })
    }
      , is = async () => await Xr().orderBy("time").first()
      , as = async () => await Xr().where("time").belowOrEqual(Date.now() + 2e3).sortBy("time")
      , os = async e => {
        const t = "string" == typeof e ? [e] : e;
        t.length && await Xr().bulkDelete(t)
    }
    ;
    var us = (e => (e.SitesResisted = "sitesResisted",
    e))(us || {});
    const ls = {}
      , cs = e => {
        e in ls && delete ls[e]
    }
      , hs = () => {
        "chrome"in globalThis && "tabs"in chrome && "onRemoved"in chrome.tabs && (chrome.tabs.onRemoved.removeListener(ds),
        chrome.tabs.onRemoved.addListener(ds),
        chrome.tabs.onUpdated.removeListener(fs),
        chrome.tabs.onUpdated.addListener(fs))
    }
    ;
    function ds(e) {
        if (!(e in ls))
            return;
        ls[e].increaseStreak()
    }
    function fs(e, t) {
        if (!(e in ls))
            return;
        if (!t.url)
            return;
        const n = ls[e];
        new URL(t.url).hostname !== n.hostname && n.increaseStreak()
    }
    hs();
    const ps = new class {
        constructor() {
            __publicField(this, "get", (async (e, {id: t, path: n, env: r, retry: s, mode: i=$r.Sync, appendIdToPath: o, responseProperty: u="", timestampKey: l=e, notifyUserOnFailure: c, queueKey: h}={}, d) => {
                i !== $r.Server && (s = !0);
                const f = a => self.requestQueue.enqueueRequest({
                    method: "get",
                    id: t,
                    type: e,
                    path: n,
                    env: r,
                    mode: i,
                    retry: s,
                    requestId: a,
                    sourceTabId: d,
                    appendIdToPath: o,
                    responseProperty: u,
                    notifyUserOnFailure: c,
                    timestampKey: l,
                    queueKey: h
                });
                return i === $r.Server ? f(a()) : (i !== $r.Cache && await f(),
                t ? Ur.getById(e, t) : Ur.get(e))
            }
            )),
            __publicField(this, "create", (async (e, t, n, {path: r, env: s, mode: i=$r.Sync, queueKey: o}={}, u) => {
                const l = i => self.requestQueue.enqueueRequest({
                    method: "create",
                    path: r,
                    type: e,
                    id: t,
                    data: n,
                    env: s,
                    requestId: i,
                    queueKey: o
                });
                if (i === $r.Server)
                    return l(a());
                i !== $r.Cache && await l(),
                await Ur.create(e, t, n),
                this.refreshAllTabs(e, await Ur.get(e), u)
            }
            )),
            __publicField(this, "update", (async (e, t, n, {path: r, env: s, mode: i=$r.Sync, queryString: o, appendIdToPath: u, queueKey: l}={}, c) => {
                const h = i => self.requestQueue.enqueueRequest({
                    method: "update",
                    path: r,
                    type: e,
                    id: t,
                    data: n,
                    env: s,
                    queryString: o,
                    appendIdToPath: u,
                    requestId: i,
                    queueKey: l
                });
                if (i === $r.Server)
                    return h(a());
                i !== $r.Cache && await h(),
                await Ur.update(e, t, n),
                this.refreshAllTabs(e, await Ur.get(e), c),
                this.refreshAllTabs(`${e}:${t}`, await Ur.getById(e, t), c)
            }
            )),
            __publicField(this, "delete", (async (e, t, {path: n, env: r, mode: s=$r.Sync, queueKey: i}={}, o) => {
                const u = s => self.requestQueue.enqueueRequest({
                    method: "delete",
                    path: n,
                    type: e,
                    id: t,
                    env: r,
                    requestId: s,
                    queueKey: i
                });
                if (s === $r.Server)
                    return u(a());
                s !== $r.Cache && await u(),
                await Ur.delete(e, t),
                this.refreshAllTabs(e, await Ur.get(e), o)
            }
            )),
            __publicField(this, "migrate", (async (e, {path: t, env: n}={}) => {
                let r = await Ur.get(e);
                r.length && await self.requestQueue.enqueueRequests(r.map((r => ({
                    data: r,
                    id: r.id,
                    method: "create",
                    type: e,
                    path: t,
                    env: n
                }))))
            }
            )),
            __publicField(this, "refreshAllTabs", ( (e, t, n) => {
                self.bus.sendToAllTabs({
                    msgId: e + ":refreshed",
                    response: t
                }, n)
            }
            )),
            __publicField(this, "flashMessage", ( (e, t) => {
                self.bus.sendToAllTabs({
                    msgId: "flashMessage",
                    response: {
                        message: e,
                        error: t,
                        id: a()
                    }
                })
            }
            )),
            __publicField(this, "getSid", (e => Lr.getSid(e))),
            __publicField(this, "setIds", ( ({cid: e, sid: t}) => Lr.set({
                cid: e,
                sid: t
            }))),
            __publicField(this, "getVersion", ( () => 6)),
            __publicField(this, "activateNewWorker", ( () => {
                self.skipWaiting()
            }
            )),
            __publicField(this, "createOrUpdateNotification", Yr),
            __publicField(this, "deleteNotification", Hr),
            __publicField(this, "deleteNotificationsOfType", Gr),
            __publicField(this, "registerNextNotification", Zr),
            __publicField(this, "increaseStreakWhenTabClosed", ( (e, t, n) => (async (e, t, n) => {
                if (hs(),
                ls[e] = {
                    increaseStreak: () => {
                        const t = {
                            subset: us.SitesResisted,
                            timestamp: Date.now(),
                            valid: !0,
                            id: a()
                        };
                        n(t),
                        cs(e)
                    }
                    ,
                    hostname: t
                },
                !("chrome"in globalThis) || !("tabs"in chrome) || !("onRemoved"in chrome.tabs))
                    return;
                const r = await chrome.tabs.get(e).catch(( () => {
                    ds(e)
                }
                ));
                r && fs(e, {
                    url: r.url
                })
            }
            )(e, t, (e => {
                this.create("streaks", e.id, e, {
                    env: n
                })
            }
            )))),
            __publicField(this, "removeStreakTabClosedListener", cs)
        }
        resetQueue() {
            self.requestQueue.reset()
        }
    }
    ;
    class ms extends Error {
        constructor(e) {
            super(e),
            this.name = "DiscardError"
        }
    }
    const ys = new g("timestamp",1)
      , gs = new S("serviceWorker.createFailed",1);
    self.addEventListener("fetch", (function(e) {
        const t = e.request;
        if ("GET" === t.method) {
            let r, s = t.url;
            try {
                const t = s.startsWith("http") ? s.lastIndexOf("?momo_cache_bg_uuid=") : -1;
                let i = null;
                if (t > 0)
                    i = s.substr(t + 20),
                    s = s.substring(0, t),
                    r = "http://momentumdash.com/photos/local-cache-key/" + i;
                else {
                    if (!s.startsWith("https://modash.blob.core.windows.net/"))
                        return;
                    {
                        const e = s.split("?");
                        2 === e.length && (r = e[0])
                    }
                }
                e.respondWith(caches.match(r).then((function(e) {
                    return e || n(s, r, i)
                }
                )))
            } catch (Is) {
                console.log("caught error: " + Is)
            }
        }
        function n(e, t, r, s) {
            return new Promise((function(i, a) {
                function o() {
                    s < 5 ? setTimeout((function() {
                        n(e, t, r, s + 1).then(i).catch(a)
                    }
                    ), 100) : a()
                }
                s = s || 0,
                fetch(e).then((function(e) {
                    if (e && e.ok) {
                        const n = e.clone();
                        caches.open("modash-cache").then((function(e) {
                            e.put(t, n)
                        }
                        )),
                        i(e)
                    } else
                        o()
                }
                )).catch((function() {
                    o()
                }
                ))
            }
            ))
        }
    }
    )),
    new class {
        constructor() {
            this.initialTimeout = 100,
            this.currentTimeout = 0,
            this.maxTimeout = 6e4,
            this.timeoutId = null,
            this.processing = !1,
            self.addEventListener("fetch", (e => {
                (e.request.url.includes("posthog.momentumdash.com/e/") || e.request.url.includes(".posthog.com") && e.request.url.includes("/e/")) && e.respondWith(this._enqueueRequest(e.request).then(this._getResponse))
            }
            ))
        }
        get queue() {
            return this.db && this.db.isOpen() || (this.db = new Rr("analyticsQueue"),
            this.db.version(1).stores({
                queue: "_key++"
            })),
            this.db.queue
        }
        _shouldProcessQueue() {
            return w("posthog.samplingRate").then((e => Math.random() < e || 0)).catch(( () => 0))
        }
        _getResponse() {
            return new Response(JSON.stringify({
                status: 1
            }),{
                status: 200,
                headers: {
                    "content-type": "application/json"
                }
            })
        }
        async _enqueueRequest(e) {
            const {url: t, method: n} = e
              , r = {}
              , s = (i = await e.arrayBuffer(),
            btoa(String.fromCharCode(...new Uint8Array(i))));
            var i;
            for (const [a,o] of e.headers.entries())
                r[a] = o;
            await this.queue.add({
                url: t,
                method: n,
                headers: r,
                data: s
            }),
            this.processing || this.timeoutId || !(await this._shouldProcessQueue()) || this._processNextRequest()
        }
        async _processNextRequest() {
            this.processing = !0;
            const e = await this.queue.toCollection().first();
            if (e) {
                let n;
                try {
                    e.data = (t = e.data,
                    new Uint8Array(Array.from(atob(t)).map((e => e.charCodeAt(0)))).buffer),
                    e.log = !1,
                    n = await h(e)
                } catch (Is) {
                    console.error(Is),
                    q.error("Error submitting PostHog event", Is)
                }
                this._shouldDiscard(null == n ? void 0 : n.status) ? (this._resetTimeout(),
                await this.queue.delete(e._key)) : this.currentTimeout = Math.min(this.currentTimeout ? 2 * this.currentTimeout : this.initialTimeout, this.maxTimeout)
            }
            var t;
            this.processing = !1,
            this.currentTimeout && !this.processing ? this.timeoutId = setTimeout(this._processNextRequest.bind(this), this.currentTimeout) : await this.queue.count() && !this.processing && this._processNextRequest()
        }
        _resetTimeout() {
            clearTimeout(this.timeoutId),
            this.timeoutId = null,
            this.currentTimeout = 0
        }
        _shouldDiscard(e) {
            return this._isSuccessful(e) || !this._shouldRetryIndefinitely(e)
        }
        _shouldRetryIndefinitely(e) {
            return !e || [502, 503, 504, 429].includes(e)
        }
        _isSuccessful(e) {
            return e >= 200 && e < 300
        }
    }
    ;
    let vs = null;
    const bs = () => chrome.runtime.getURL("offscreenDocument.html");
    async function ws() {
        if (await async function() {
            if ("getContexts"in chrome.runtime) {
                const e = await chrome.runtime.getContexts({
                    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
                    documentUrls: [bs()]
                });
                return Boolean(e.length)
            }
            return (await self.clients.matchAll()).some((e => {
                e.url.includes(chrome.runtime.id)
            }
            ))
        }())
            return;
        (await chrome.runtime.getContexts({
            contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
            documentUrls: [bs()]
        })).length > 0 || (vs ? await vs : (vs = chrome.offscreen.createDocument({
            url: bs(),
            reasons: [chrome.offscreen.Reason.LOCAL_STORAGE],
            justification: "Making a request and saving results into Local Storage"
        }),
        await vs,
        vs = null))
    }
    const _s = "register"
      , ks = ".legacyUserMigration"
      , xs = "offscreenDocument" + ks
      , Es = "backgroundScript" + ks
      , Ss = function(e, t, n) {
        let r = Promise.resolve();
        return r.then(( () => e())).catch((e => {
            const t = new Event("vite:preloadError",{
                cancelable: !0
            });
            if (t.payload = e,
            window.dispatchEvent(t),
            !t.defaultPrevented)
                throw e
        }
        ))
    };
    async function qs({context: e, tabId: t, loggerName: n}, r) {
        try {
            const e = await async function(e) {
                const t = localStorage.getObject("momentum-customization-1").displayname
                  , n = (await Ss((async () => {
                    const {default: e} = await Promise.resolve().then(( () => Ts));
                    return {
                        default: e
                    }
                }
                ), void 0)).default()
                  , r = await h({
                    method: "post",
                    url: n + "user:migrateLegacy?canceled=true",
                    data: {
                        name: t
                    },
                    headers: {
                        "X-Momentum-Version": c.version,
                        "X-Momentum-ClientDate": i(),
                        "X-Momentum-ClientId": localStorage.getItem("client_uuid"),
                        "X-Momentum-TabId": e
                    }
                });
                if (d(null == r ? void 0 : r.status) && r.data)
                    return localStorage.setItem("token", r.data.token),
                    localStorage.setItem("token_uuid", r.data.token_uuid),
                    localStorage.setItem("unregistered", !0),
                    r.data.settings;
                throw new Error("Legacy Migration Request Failed",r)
            }(t);
            r({
                success: !0,
                settings: e
            })
        } catch (s) {
            if (console.error(s),
            n) {
                new S(n).error(e + " migration error", {
                    errorMessage: s.message,
                    stack: s.stack,
                    phase: _s
                })
            }
            r({
                success: !1,
                error: s
            })
        }
    }
    (null == (e = self.chrome) ? void 0 : e.runtime) && (chrome.runtime.onInstalled.addListener((async function(e) {
        chrome.runtime.setUninstallURL("https://momentumdash.com/uninstall"),
        chrome.runtime.OnInstalledReason && ((null == e ? void 0 : e.reason) === chrome.runtime.OnInstalledReason.INSTALL && (await v.set("installDate", Date.now()),
        await v.set("calculateUnregisteredDashboardExperiment", !0),
        await chrome.tabs.create({
            url: "index.html"
        })),
        (null == e ? void 0 : e.reason) === chrome.runtime.OnInstalledReason.UPDATE && await v.set("releaseUpdateModalCheck", !0))
    }
    )),
    null == (t = self.isServiceWorker ? chrome.action : chrome.browserAction) || t.onClicked.addListener((function() {
        chrome.tabs.create({
            url: "index.html"
        })
    }
    )),
    chrome.runtime.onMessage.addListener((function(e, t, n) {
        var r, s, i;
        switch (e.type) {
        case "oneTimeLogin":
            {
                let r = function(e) {
                    "oneTimeLogin:response" === e.type && (n(e.payload),
                    chrome.runtime.onMessage.removeListener(r))
                };
                chrome.runtime.onMessage.addListener(r);
                let s = new URLSearchParams(e.payload);
                e.legacy && s.set("legacy", "true");
                let i = "index.html?" + s.toString();
                return e.updateSenderTab ? chrome.tabs.update(t.tab.id, {
                    url: i
                }) : chrome.tabs.create({
                    url: i
                }),
                !0
            }
        case "momentum:authState":
            {
                const {userId: t, src: n, loginState: r} = e.data || {};
                !n || !t && r || v.patch("authState", {
                    [n]: r ? t : null
                });
                break
            }
        case "momentum:checkUserId":
            {
                const t = null == (r = e.payload) ? void 0 : r.userUuid;
                return ps.get("main", {
                    id: "user",
                    mode: $r.Cache
                }).then((e => {
                    const r = {
                        isLoggedIn: !!e
                    };
                    r.isSameAccount = t === (null == e ? void 0 : e.uuid),
                    n(r)
                }
                )).catch(( () => {
                    n({
                        isLoggedIn: !1
                    })
                }
                )),
                !0
            }
        case "momentum:getUserId":
            return ps.get("main", {
                id: "user",
                mode: $r.Cache
            }).then((e => {
                n({
                    userId: (null == e ? void 0 : e.uuid) ?? null
                })
            }
            )).catch(( () => {
                n({
                    userId: null
                })
            }
            )),
            !0;
        case "momentum:openNew":
            {
                const r = e => {
                    n({
                        success: !!e
                    })
                }
                  , a = new URLSearchParams((null == (s = e.payload) ? void 0 : s.params) ?? {}).toString()
                  , o = "index.html" + (a ? "?" + a : "");
                return (null == (i = e.payload) ? void 0 : i.updateSenderTab) ? chrome.tabs.update(t.tab.id, {
                    url: o
                }, r) : chrome.tabs.create({
                    url: o,
                    active: !0
                }, r),
                !0
            }
        case "legacyUserMigration":
            return (async () => {
                if (self.isServiceWorker) {
                    await ws();
                    const t = await new Promise((t => {
                        chrome.runtime.sendMessage({
                            type: "legacyUserMigration:triggerOffscreenDocumentRequest",
                            payload: {
                                context: "offscreen document",
                                tabId: e.data.tabId,
                                loggerName: xs
                            }
                        }, t)
                    }
                    ));
                    n(t)
                } else
                    await qs({
                        context: "background script",
                        tabId: e.data.tabId,
                        loggerName: Es
                    }, n)
            }
            )(),
            !0
        }
    }
    )));
    self.addEventListener("error", (e => {
        let t;
        e.name === Rr.errnames.OpenFailed && (t = {
            error: JSON.stringify(e),
            inner: e.inner,
            message: e.message,
            stack: e.stack
        }),
        q.error(t || e)
    }
    )),
    self.requestQueue = new class {
        constructor() {
            this.reset(),
            this.activated = !1
        }
        reset() {
            this.pendingRequests = {},
            this.processing = {},
            this.timeouts = {},
            this.timeoutIds = {},
            this.afterCurrentRequest = null
        }
        get _queue() {
            return this.db && this.db.isOpen() || (this.db = new Rr("xhrQueue"),
            this.db.version(1).stores({
                queue: "_key++,id,method,type"
            })),
            this.db.queue
        }
        get _requestsAreProcessing() {
            return Object.values(this.processing).some((e => e))
        }
        activate() {
            navigator.connection && (navigator.connection.onchange = this._onConnectionChange.bind(this)),
            this.activated = !0,
            this._processAllQueues()
        }
        async enqueueRequest({method: e, type: t, path: n, id: r, data: s, env: i, retry: a, requestId: o, queryString: u, appendIdToPath: c, responseProperty: h, timestampKey: d=t, notifyUserOnFailure: f, queueKey: p=t}) {
            if (!e)
                throw new Error('Enqueued requests must contain a "method" property.');
            if (!t)
                throw new Error('Enqueued requests must contain a "type" property.');
            if (!i)
                throw new Error('Enqueued requests must contain a "env" property.');
            if (["update", "delete"].includes(e) && !r)
                throw new Error('Enqueued update & delete requests with must contain a "id" property.');
            const m = {
                method: e,
                type: t,
                path: n,
                id: r,
                data: s,
                env: i,
                retry: a,
                requestId: o,
                queryString: u,
                appendIdToPath: c,
                responseProperty: h,
                notifyUserOnFailure: f,
                timestampKey: d,
                queueKey: p
            };
            await this._queue.put(m);
            const y = l(m);
            if (!this.timeoutIds[y] && this.activated && this._processNextRequest(y),
            o)
                return new Promise(( (e, t) => this.pendingRequests[o] = {
                    resolve: e,
                    reject: t
                }))
        }
        async enqueueRequests(e) {
            let t = [];
            e.forEach((e => {
                if (!e.method)
                    throw new Error('Enqueued requests must contain a "method" property.');
                if (!e.type)
                    throw new Error('Enqueued requests must contain a "type" property.');
                if (!e.env)
                    throw new Error('Enqueued requests must contain a "env" property.');
                const n = l(e);
                t.includes(n) || t.push(n)
            }
            )),
            await this._queue.bulkPut(e),
            this.activated && t.forEach((e => {
                this.timeoutIds[e] || this._processNextRequest(e)
            }
            ))
        }
        terminateAfterActiveRequests() {
            return this._requestsAreProcessing ? new Promise((e => {
                this.afterCurrentRequest = () => {
                    this._requestsAreProcessing || e()
                }
            }
            )) : (this._resetTimeout(),
            Promise.resolve())
        }
        async _processNextRequest(e) {
            var t, n;
            if (!e)
                throw new Error("_processNextRequest must be called with a queueKey");
            if (this.processing[e])
                return;
            this.processing[e] = !0,
            this.timeoutIds[e] = null;
            let r = await this._getValidQueueEntries(e).first();
            if (r) {
                const {_key: i, method: a, attempts: o, retry: u=!0, requestId: l, notifyUserOnFailure: c=!0, ...h} = r;
                let d, f, p = !1, m = !1;
                try {
                    d = await this["_" + a]({
                        requestId: l,
                        ...h
                    }),
                    f = null == d ? void 0 : d.status
                } catch (Is) {
                    if (Is instanceof ms)
                        m = !0;
                    else {
                        if (C({
                            message: "Error processing request",
                            error: Is,
                            queueEntry: r
                        }),
                        "No matching sid found" === Is.message)
                            try {
                                await this._recoverMissingSid(r),
                                p = !0
                            } catch (s) {
                                C({
                                    message: "Request recovery failed",
                                    error: s,
                                    queueEntry: r
                                })
                            }
                        l && (p ? null == (t = this.pendingRequests[l]) || t.resolve() : null == (n = this.pendingRequests[l]) || n.reject(Is))
                    }
                }
                401 === f && "create" === a && C({
                    message: "Create failed due to 401",
                    queueEntry: r,
                    logger: gs
                }),
                this._isSuccessful(f) || p || m ? (this._resetTimeout(e),
                await this._queue.delete(i)) : !u || this._shouldDiscard(f) ? (this._resetTimeout(e),
                await this._cleanUpFailedRequest(r),
                c && this._alertFailedRequest(r, d)) : this._shouldRetry(f) && (429 === f && d.headers["retry-after"] ? this.timeouts[e] = 1e3 * parseInt(d.headers["retry-after"]) : this.timeouts[e] = this.timeouts[e] ? 2 * this.timeouts[e] : 100,
                this.timeouts[e] = Math.min(this.timeouts[e], 6e4),
                !this._shouldRetryIndefinitely(f) && o >= 5 ? (this._resetTimeout(e),
                await this._cleanUpFailedRequest(r),
                c && this._alertFailedRequest(r, d)) : await this._queue.update(i, {
                    attempts: (o || 0) + 1
                }))
            }
            this.processing[e] = !1,
            this.afterCurrentRequest ? this.afterCurrentRequest() : this.timeouts[e] ? this.timeoutIds[e] = setTimeout(( () => this._processNextRequest(e)), this.timeouts[e]) : await this._getValidQueueEntries(e).count() && this._processNextRequest(e)
        }
        _processAllQueues() {
            return this._getAllQueueKeys().then((e => e.forEach((e => this._processNextRequest(e)))))
        }
        _shouldDiscard(e) {
            return this._isSuccessful(e) || !this._shouldRetry(e)
        }
        _shouldRetry(e) {
            return this._shouldRetryIndefinitely(e) || 401 === e
        }
        _shouldRetryIndefinitely(e) {
            return !e || [429, 502, 503, 504].includes(e)
        }
        _isSuccessful(e) {
            return d(e)
        }
        async _get({id: e, type: t, path: n, env: r, requestId: s, appendIdToPath: i=!0, responseProperty: a, timestampKey: u=t, queueKey: l=t, ...c}) {
            var h, d;
            const f = await this._request({
                url: `${n || t}${e && i ? `/${e}` : ""}`,
                env: r
            });
            if (await this._queueContainsMutationsOfType(l))
                throw s && await this._queue.put({
                    method: "get",
                    id: e,
                    type: t,
                    path: n,
                    env: r,
                    requestId: s,
                    appendIdToPath: i,
                    responseProperty: a,
                    queueKey: l,
                    ...c
                }),
                new ms("Mutation enqueued after get request");
            if (this._isSuccessful(null == f ? void 0 : f.status)) {
                const e = null == (h = null == f ? void 0 : f.headers) ? void 0 : h.date;
                e && await this._saveTimestamp(u, new Date(e).getTime())
            }
            const p = a ? o(f.data, a) : f.data;
            if (p) {
                let n;
                e ? (n = await Lr.convertDataToClientIds(p),
                await Ur.update(t, e, n)) : (n = await Lr.convertDataArrayToClientIds(p),
                await Ur.refresh(t, n)),
                ps.refreshAllTabs(`${t}${e ? `:${e}` : ""}`, n),
                s && (null == (d = this.pendingRequests[s]) || d.resolve(n))
            }
            return f
        }
        async _create({type: e, path: t, id: n, data: r, env: s, requestId: i}) {
            var a, o, u;
            if (await Lr.checkCidExists(n)) {
                const o = new ms("Item creation attempted when CID already mapped");
                throw C({
                    error: o,
                    queueEntry: {
                        type: e,
                        path: t,
                        id: n,
                        data: r,
                        env: s,
                        method: "create"
                    }
                }),
                i && (null == (a = this.pendingRequests[i]) || a.reject(o)),
                o
            }
            delete r.id;
            const l = await this._request({
                method: "POST",
                url: t || e,
                data: await Lr.convertDataToServerIds(r),
                env: s
            });
            return (null == (o = null == l ? void 0 : l.data) ? void 0 : o.id) && await Lr.set({
                cid: n,
                sid: l.data.id
            }),
            i && this._isSuccessful(null == l ? void 0 : l.status) && (null == (u = this.pendingRequests[i]) || u.resolve()),
            l
        }
        async _update({type: e, path: t, id: n, data: r, env: s, queryString: i="", requestId: a, appendIdToPath: o=!0}) {
            var u;
            const l = await this._request({
                method: "PATCH",
                url: `${t || e}${o ? `/${await Lr.getSid(n)}` : ""}${i}`,
                data: await Lr.convertDataToServerIds(r),
                env: s
            });
            return a && this._isSuccessful(null == l ? void 0 : l.status) && (null == (u = this.pendingRequests[a]) || u.resolve()),
            l
        }
        async _delete({type: e, path: t, id: n, env: r, requestId: s}) {
            var i;
            const a = await this._request({
                method: "DELETE",
                url: `${t || e}/${await Lr.getSid(n)}`,
                env: r
            });
            return s && this._isSuccessful(null == a ? void 0 : a.status) && (null == (i = this.pendingRequests[s]) || i.resolve()),
            a
        }
        _request({method: e="GET", url: t, data: n, env: r}) {
            return h({
                url: r.apiUrl + t,
                method: e,
                data: n,
                headers: this._getHeaders(r)
            })
        }
        async _saveTimestamp(e, t) {
            e && t && await ys.set(e, {
                cache: t,
                server: t
            })
        }
        async _cleanUpFailedRequest(e) {
            const {_key: t, type: n, id: r, method: s} = e;
            await this._queue.delete(t),
            "create" === s && await Ur.delete(n, r),
            ps.refreshAllTabs(n, await Ur.get(n))
        }
        _alertFailedRequest(e, t) {
            var n;
            const {type: r, method: s, requestId: i, attempts: a} = e;
            C({
                message: "Request failed",
                queueEntry: e,
                additionalData: {
                    statusCode: t.status,
                    attempts: a
                }
            }),
            ps.flashMessage(function(e, t) {
                const n = {
                    focus: {
                        singular: "focus",
                        plural: "focuses"
                    },
                    onboardingSteps: {
                        singular: "onboarding progress",
                        plural: "onboarding progress"
                    }
                }
                  , {verb: r, plural: s} = {
                    get: {
                        verb: "getting",
                        plural: !0
                    },
                    create: {
                        verb: "creating"
                    },
                    update: {
                        verb: "updating"
                    },
                    delete: {
                        verb: "deleting"
                    }
                }[t];
                var i;
                return `Sorry, there was an error ${r} your ${e = n[e] ? n[e][s ? "plural" : "singular"] : function(e) {
                    return e ? (t = e = e.replace(/([A-Z])/gm, (e => " " + e.toLowerCase()))) ? t.slice(0, 1).toUpperCase() + t.slice(1) : null : null;
                    var t
                }(s ? e : (i = e,
                i.endsWith("s") ? i.substring(0, i.length - 1) : i)).toLowerCase()}.`
            }(r, s), !0),
            i && (null == (n = this.pendingRequests[i]) || n.reject(t))
        }
        _getHeaders({version: e, token: t, clientUuid: n, tabId: r}) {
            const s = {
                "X-Momentum-Version": e,
                "X-Momentum-ClientDate": i()
            };
            return t && (s.Authorization = "Bearer " + t),
            n && (s["X-Momentum-ClientId"] = n),
            r && (s["X-Momentum-TabId"] = r),
            s
        }
        async _recoverMissingSid({type: e, path: t, id: n, env: r}={}) {
            const s = await Ur.dbs[e].get(n);
            if (!s)
                return await this._deleteAllInQueue({
                    id: n
                }),
                void C({
                    message: "Sid recovery failed: Item not found",
                    queueEntry: arguments[0]
                });
            delete s.id;
            const i = await this._create({
                type: e,
                path: t,
                id: n,
                data: s,
                env: r
            });
            if (!i || !this._isSuccessful(i.status))
                return C({
                    message: "Sid recovery failed: Create request failed",
                    queueEntry: arguments[0],
                    additionalData: {
                        statusCode: i.status
                    }
                }),
                await Ur.delete(e, n),
                ps.refreshAllTabs(e, await Ur.get(e)),
                void (await this._deleteAllInQueue({
                    id: n
                }));
            await this._deleteAllInQueue({
                id: n,
                method: "update"
            })
        }
        async _deleteAllInQueue(e={}) {
            const t = await this._queue.where(e).primaryKeys();
            await this._queue.bulkDelete(t)
        }
        _resetTimeout(e) {
            clearTimeout(this.timeoutIds[e]),
            this.timeoutIds[e] = null,
            this.timeouts[e] = 0
        }
        _getValidQueueEntries(e) {
            return this._queue.filter((t => l(t) === e && this._isValidEntry(t)))
        }
        async _getAllQueueKeys() {
            const e = new Set((await this._queue.toArray()).map(l));
            return Array.from(e)
        }
        async _queueContainsMutationsOfType(e) {
            return await this._queue.filter((t => l(t) === e && ["create", "update", "delete"].includes(t.method))).count() > 0
        }
        _isValidEntry(e) {
            return ["get", "create", "update", "delete"].includes(e.method)
        }
        _onConnectionChange() {
            navigator.onLine && !this._requestsAreProcessing && (this._resetTimeout(),
            this._processAllQueues())
        }
    }
    ,
    "activated" === (null == (n = self.serviceWorker) ? void 0 : n.state) && self.requestQueue.activate(),
    self.bus = (null == (r = self.chrome) ? void 0 : r.runtime) ? new class extends j {
        constructor(e) {
            super(e),
            chrome.runtime.onMessage.addListener((e => {
                "backgroundWorker" === e.target && this._onMessage(e, this.sendToAllTabs)
            }
            ))
        }
        sendToAllTabs(e, t) {
            e.target = "tabs",
            e.exemptedTabId = t,
            chrome.runtime.sendMessage(e)
        }
    }
    (ps) : new j(ps),
    self.addEventListener("install", (function() {
        self.registration.active && self.registration.active.scriptURL.endsWith("serviceWorker.js") ? self.timeout = setTimeout(( () => {
            self.skipWaiting()
        }
        ), 5e3) : self.skipWaiting()
    }
    )),
    self.addEventListener("activate", (function(e) {
        self.timeout && clearTimeout(self.timeout),
        e.waitUntil(self.clients.claim()),
        self.requestQueue.activate()
    }
    )),
    self.registration.addEventListener("updatefound", ( () => {
        var e;
        if ("installing" === (null == (e = self.serviceWorker) ? void 0 : e.state))
            return;
        const t = self.registration.installing;
        self.requestQueue.terminateAfterActiveRequests().then(( () => {
            t.postMessage({
                msgId: "activateNewWorker",
                handler: "activateNewWorker"
            })
        }
        ))
    }
    ));
    const Ts = Object.freeze(Object.defineProperty({
        __proto__: null,
        default: () => c.apiUrl
    }, Symbol.toStringTag, {
        value: "Module"
    }))
}();
