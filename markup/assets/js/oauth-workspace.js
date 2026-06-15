(function () {
    const maxDefault = 5;

    const updateAddButton = (list, button) => {
        if (!list || !button) {
            return;
        }

        const max = Number(list.dataset.oauthUriMax || maxDefault);
        const count = list.querySelectorAll('[data-oauth-uri-row]').length;
        const addRow = button.closest('.kt-oauth-uri-add-row');
        const isMax = count >= max;

        button.disabled = isMax;

        if (addRow) {
            addRow.hidden = isMax;
        }
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

    const createUriRow = (value, list) => {
        const row = document.createElement(list?.tagName === 'UL' ? 'li' : 'div');
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
        input.value = value || '';
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

        const addControl = button.closest('.kt-oauth-uri-add-row')?.querySelector('[data-newwork-input]');

        list.querySelectorAll('[data-oauth-uri-row]').forEach(row => {
            bindRemove(row, list, button);
            bindInputClear(row);
        });
        bindInputClear(addControl?.closest('.kt-oauth-uri-add-row') || addControl);
        updateAddButton(list, button);

        button.addEventListener('click', () => {
            const max = Number(list.dataset.oauthUriMax || maxDefault);
            const addInput = button.dataset.oauthUriInput ? document.getElementById(button.dataset.oauthUriInput) : null;
            const nextValue = addInput?.value.trim() || '';

            if (button.disabled || list.querySelectorAll('[data-oauth-uri-row]').length >= max) {
                return;
            }

            if (addInput && !nextValue) {
                addInput.focus();
                return;
            }

            const row = createUriRow(nextValue, list);

            list.appendChild(row);
            bindRemove(row, list, button);
            bindInputClear(row);
            updateAddButton(list, button);

            if (addInput) {
                addInput.value = '';
                syncInputClear(addControl);
                addInput.focus();
            } else {
                row.querySelector('input')?.focus();
            }
        });
    });

    const syncUriReadList = section => {
        const readList = section?.querySelector('[data-oauth-uri-read]');
        const editRows = Array.from(section?.querySelectorAll('[data-oauth-uri-row]') || []);

        if (!readList || !editRows.length) {
            return;
        }

        readList.replaceChildren();

        editRows.forEach(row => {
            const value = row.querySelector('input')?.value.trim();

            if (!value) {
                return;
            }

            const item = document.createElement('li');
            const text = document.createElement('span');

            item.className = 'kt-env-card__item kt-env-card__item--plain';
            text.textContent = value;
            item.appendChild(text);
            readList.appendChild(item);
        });
    };

    const getScopeItemData = item => {
        const input = item?.querySelector('input[type="checkbox"]');
        const labelText = item?.dataset.scopeLabel || item?.querySelector('.kt-check span:not(.kt-badge)')?.textContent.trim() || '';

        return {
            input,
            labelText,
            state: item?.dataset.scopeState || 'available',
            value: input?.value || '',
        };
    };

    const createScopeBadge = state => {
        const badge = document.createElement('span');

        badge.className = 'kt-badge';

        if (state === 'current') {
            badge.classList.add('kt-badge--green');
            badge.textContent = '사용중';
            return badge;
        }

        if (state === 'rejected') {
            badge.classList.add('kt-badge--danger');
            badge.textContent = '반려';
            return badge;
        }

        if (state === 'pending') {
            badge.classList.add('kt-badge--warning');
            badge.textContent = '승인대기';
            return badge;
        }

        badge.textContent = '추가';

        return badge;
    };

    const createScopeReadItem = (section, item) => {
        const { labelText, state, value } = getScopeItemData(item);
        const li = document.createElement('li');
        const label = document.createElement('span');

        li.className = 'kt-env-card__item kt-env-card__item--scope';
        li.dataset.scopeValue = value;
        label.textContent = labelText;
        li.appendChild(label);

        li.appendChild(createScopeBadge(state));

        return li;
    };

    const syncScopeReadList = section => {
        const readList = section?.querySelector('[data-oauth-scope-read]');
        const editItems = Array.from(section?.querySelectorAll('.kt-oauth-scope-edit-grid > li') || []);

        if (!readList || !editItems.length) {
            return;
        }

        readList.replaceChildren();

        editItems.forEach(item => {
            const { input } = getScopeItemData(item);

            if (!input?.checked) {
                return;
            }

            readList.appendChild(createScopeReadItem(section, item));
        });
    };

    document.querySelectorAll('.kt-oauth-scope-edit-grid .kt-check').forEach(label => {
        label.classList.add('kt-check--box');
    });

    document.querySelectorAll('.kt-oauth-section-scope').forEach(syncScopeReadList);

    document.addEventListener('click', e => {
        const editDeleteButton = e.target.closest('[data-oauth-scope-delete]');
        const readDeleteButton = e.target.closest('[data-oauth-scope-read-delete]');
        const saveButton = e.target.closest('[data-edit-save]');

        if (editDeleteButton) {
            const item = editDeleteButton.closest('.kt-oauth-scope-edit-grid > li');

            if (item) {
                e.preventDefault();
                item.remove();
            }

            return;
        }

        if (readDeleteButton) {
            const section = readDeleteButton.closest('.kt-oauth-section-scope');
            const value = readDeleteButton.dataset.scopeValue;
            const input = value ? section?.querySelector(`.kt-oauth-scope-edit-grid input[value="${value}"]`) : null;

            e.preventDefault();
            readDeleteButton.closest('.kt-env-card__item')?.remove();

            if (input) {
                input.checked = false;
            }

            return;
        }

        if (saveButton) {
            syncUriReadList(saveButton.closest('.kt-ws-section'));
            syncScopeReadList(saveButton.closest('.kt-oauth-section-scope'));
        }
    });
})();
