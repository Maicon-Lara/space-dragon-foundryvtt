// SPDX-License-Identifier: MIT
// Copyright © 2021 fvtt-lib-wrapper Rui Pinheiro
//
// A shim oficial do libWrapper (https://github.com/ruipin/fvtt-lib-wrapper/blob/master/shim/shim.js),
// com três adaptações marcadas "spacedragon": o id e o título do pacote
// fixados em vez de auto-detectados, o aviso em português e via DialogV2, e
// guardas para o teste de fumaça, que sobe o módulo sem `game.user`.

'use strict';

// A shim for the libWrapper library
export let libWrapper = undefined;

export const VERSIONS       = [1,13,0];
export const TGT_SPLIT_RE   = new RegExp("([^.[]+|\\[('([^'\\\\]|\\\\.)+?'|\"([^\"\\\\]|\\\\.)+?\")\\])", 'g');
export const TGT_CLEANUP_RE = new RegExp("(^\\['|'\\]$|^\\[\"|\"\\]$)", 'g');

// Main shim code
// spacedragon: fora do Foundry (nos testes em Node) não há `Hooks`; a shim é
// instalada na hora, para os envelopes funcionarem igual.
const instalarShim = () => {
	// Check if the real module is already loaded - if so, use it
	if(globalThis.libWrapper && !(globalThis.libWrapper.is_fallback ?? true)) {
		libWrapper = globalThis.libWrapper;
		return;
	}

	// Fallback implementation
	libWrapper = class {
		static get is_fallback() { return true };

		static get WRAPPER()  { return 'WRAPPER'  };
		static get MIXED()    { return 'MIXED'    };
		static get OVERRIDE() { return 'OVERRIDE' };
		static get LISTENER() { return 'LISTENER' };

		static register(package_id, target, fn, type="MIXED", {chain=undefined, bind=[]}={}) {
			const is_setter = target.endsWith('#set');
			target = !is_setter ? target : target.slice(0, -4);
			const split = target.match(TGT_SPLIT_RE).map((x)=>x.replace(/\\(.)/g, '$1').replace(TGT_CLEANUP_RE,''));
			const root_nm = split.splice(0,1)[0];

			let obj, fn_name;
			if(split.length == 0) {
				obj = globalThis;
				fn_name = root_nm;
			}
			else {
				const _eval = eval;
				fn_name = split.pop();
				obj = split.reduce((x,y)=>x[y], globalThis[root_nm] ?? _eval(root_nm));
			}

			let iObj = obj;
			let descriptor = null;
			while(iObj) {
				descriptor = Object.getOwnPropertyDescriptor(iObj, fn_name);
				if(descriptor) break;
				iObj = Object.getPrototypeOf(iObj);
			}
			if(!descriptor || descriptor?.configurable === false) throw new Error(`libWrapper Shim: '${target}' does not exist, could not be found, or has a non-configurable descriptor.`);

			let original = null;
			const is_override = (type == 3 || type.toUpperCase?.() == 'OVERRIDE' || type == 3);
			const is_listener = (type == 4 || type.toUpperCase?.() == 'LISTENER' || type == 4);
			const wrapper = is_listener ? (
				function(...args) { fn.call(this, ...bind, ...args); return original.call(this, ...args); }
			) : ((chain ?? !is_override) ?
				function(...args) { return fn.call(this, original.bind(this), ...bind, ...args); } :
				function(...args) { return fn.call(this, ...bind, ...args); }
			);

			if(!is_setter) {
				if(descriptor.value) {
					original = descriptor.value;
					descriptor.value = wrapper;
				}
				else {
					original = descriptor.get;
					descriptor.get = wrapper;
				}
			}
			else {
				if(!descriptor.set) throw new Error(`libWrapper Shim: '${target}' does not have a setter`);
				original = descriptor.set;
				descriptor.set = wrapper;
			}

			descriptor.configurable = true;
			Object.defineProperty(obj, fn_name, descriptor);
		}
	}

	// spacedragon: id e título fixos — a auto-detecção lê a URL do script, que
	// no teste de fumaça não passa por /modules/.
	const PACKAGE_ID = "spacedragon";
	const PACKAGE_TITLE = "Space Dragon — Livro Básico";

	globalThis.Hooks?.once?.('ready', () => {
		// spacedragon: aviso em português, pela DialogV2 (a Dialog antiga está
		// marcada para sair do Foundry).
		const FALLBACK_MESSAGE = `
			<p><b>O módulo '${PACKAGE_TITLE}' funciona melhor com o módulo 'libWrapper', que não está instalado.</b></p>
			<p>Uma implementação reserva será usada. Ela funciona, mas aumenta a chance de conflito com outros módulos que alterem as mesmas partes do sistema.</p>
			<small><p>O 'libWrapper' é uma biblioteca que dá aos módulos um jeito seguro de alterar o código do Foundry VTT e dos sistemas, reduzindo conflitos entre eles.</p>
			<p>Instale pela aba "Módulos" da configuração do Foundry VTT, ou por <a href="https://foundryvtt.com/packages/lib-wrapper">foundryvtt.com/packages/lib-wrapper</a>.</p></small>
		`;

		// Settings key used for the "Don't remind me again" setting
		const DONT_REMIND_AGAIN_KEY = "libwrapper-dont-remind-again";

		console.warn(`${PACKAGE_TITLE}: libWrapper not present, using fallback implementation.`);
		game.settings.register(PACKAGE_ID, DONT_REMIND_AGAIN_KEY, { name: '', default: false, type: Boolean, scope: 'world', config: false });

		// spacedragon: sem Mestre (teste de fumaça) ou sem DialogV2, não há a quem avisar.
		const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
		if(!game.user?.isGM || !DialogV2 || game.settings.get(PACKAGE_ID, DONT_REMIND_AGAIN_KEY)) return;
		DialogV2.wait({
			window: { title: PACKAGE_TITLE },
			content: FALLBACK_MESSAGE,
			buttons: [
				{ action: "ok", label: "Entendi", icon: "fas fa-check", default: true },
				{ action: "dont_remind", label: "Não lembrar de novo", icon: "fas fa-times",
				  callback: () => game.settings.set(PACKAGE_ID, DONT_REMIND_AGAIN_KEY, true) },
			],
		}).catch(() => {});
	});
};

if (globalThis.Hooks?.once) Hooks.once('init', instalarShim);
else instalarShim();
