(function () {
    const maxDefault = 5;

    const updateAddButton = (list, button) => {
        if (!list || !button) {
            return;
        }

        const max = Number(list.dataset.oauthUriMax || maxDefault);
        const count = list.querySelectorAll('[data-oauth-uri-row]').length;

        button.disabled = count >= max;
    };

    const bindRemove = (row, list, button) => {
        const remove = row.querySelector('[data-oauth-uri-remove]');

        remove?.addEventListener('click', () => {
            row.remove();
            updateAddButton(list, button);
        });
    };

    const syncInputClear = control => {
        const input = control.querySelector('input');
        const clear = control.querySelector('[data-newwork-input-clear]');
        const hasValue = Boolean(input?.value.trim());

        if (!clear) {
            return;
        }

        clear.hidden = !hasValue;
        clear.setAttribute('aria-hidden', String(!hasValue));
        clear.setAttribute('tabindex', hasValue ? '0' : '-1');
    };

    const bindInputClear = row => {
        const control = row.querySelector('[data-newwork-input]');
        const input = control?.querySelector('input');
        const clear = control?.querySelector('[data-newwork-input-clear]');

        if (!control || !input || !clear || clear.dataset.oauthInputClearBound === 'true') {
            return;
        }

        input.addEventListener('input', () => syncInputClear(control));
        clear.addEventListener('click', event => {
            event.preventDefault();
            input.value = '';
            syncInputClear(control);
            input.focus();
        });

        clear.dataset.oauthInputClearBound = 'true';
        syncInputClear(control);
    };

    const createUriRow = () => {
        const row = document.createElement('div');
        const control = document.createElement('div');
        const input = document.createElement('input');
        const clear = document.createElement('button');
        const remove = document.createElement('button');
        const clearBlind = document.createElement('span');
        const blind = document.createElement('span');

        row.className = 'kt-oauth-uri-row';
        row.dataset.oauthUriRow = '';

        control.className = 'kt-newwork-input-control';
        control.dataset.newworkInput = '';

        input.type = 'url';
        input.className = 'kt-input kt-input--48';
        input.placeholder = 'https://';
        input.setAttribute('aria-label', 'Redirect URI 입력');

        clear.type = 'button';
        clear.className = 'kt-newwork-input-clear';
        clear.dataset.newworkInputClear = '';
        clear.hidden = true;

        clearBlind.className = 'blind';
        clearBlind.textContent = '입력값 삭제';

        remove.type = 'button';
        remove.className = 'kt-oauth-uri-remove';
        remove.dataset.oauthUriRemove = '';
        remove.setAttribute('aria-label', 'Redirect URI 삭제');

        blind.className = 'blind';
        blind.textContent = '삭제';

        clear.appendChild(clearBlind);
        remove.appendChild(blind);
        control.appendChild(input);
        control.appendChild(clear);
        row.appendChild(control);
        row.appendChild(remove);

        return row;
    };

    document.querySelectorAll('[data-oauth-uri-list]').forEach(list => {
        const button = document.querySelector(`[data-oauth-uri-add="${list.id}"]`) || list.parentElement?.querySelector('[data-oauth-uri-add]');

        if (!button) {
            return;
        }

        list.querySelectorAll('[data-oauth-uri-row]').forEach(row => {
            bindRemove(row, list, button);
            bindInputClear(row);
        });
        updateAddButton(list, button);

        button.addEventListener('click', () => {
            const max = Number(list.dataset.oauthUriMax || maxDefault);

            if (list.querySelectorAll('[data-oauth-uri-row]').length >= max) {
                return;
            }

            const row = createUriRow();

            list.appendChild(row);
            bindRemove(row, list, button);
            bindInputClear(row);
            updateAddButton(list, button);
            row.querySelector('input')?.focus();
        });
    });
})();
