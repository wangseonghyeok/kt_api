(function () {
    const workspaceRoot = document.querySelector('.kt-ws-popup') || document.querySelector('[data-ldap-components]');

    if (!workspaceRoot) {
        return;
    }

    const getEditTemplate = section => Array.from(section.children).find(child => child.classList.contains('kt-edit-template'));
    const getControlValue = control => (control.value || '').trim();

    const resetBasicEditFields = section => {
        section.querySelectorAll('[data-basic-field]').forEach(control => {
            const valueCell = section.querySelector(`[data-basic-value="${control.dataset.basicField}"]`);

            if (valueCell) {
                control.value = valueCell.textContent.trim();
            }
        });
    };

    const updateText = (selector, value) => {
        workspaceRoot.querySelectorAll(selector).forEach(target => {
            target.textContent = value;
        });
    };

    const saveBasicInfo = section => {
        const values = {};

        section.querySelectorAll('[data-basic-field]').forEach(control => {
            const field = control.dataset.basicField;
            const value = getControlValue(control);
            const valueCell = section.querySelector(`[data-basic-value="${field}"]`);

            values[field] = value;
            control.value = value;

            if (valueCell) {
                valueCell.textContent = value;
            }
        });

        if (Object.prototype.hasOwnProperty.call(values, 'workspaceName')) {
            updateText('.kt-ws-popup__title, .kt-ws-summary__title > strong', values.workspaceName);
        }

        if (Object.prototype.hasOwnProperty.call(values, 'description')) {
            updateText('.kt-ws-summary__desc', values.description);
        }
    };

    const setEditMode = (section, isEditing) => {
        const button = section.querySelector('.kt-ws-section__head .kt-btn--popup');
        const hasEditActions = Boolean(section.querySelector('[data-edit-cancel], [data-edit-save]'));

        section.classList.toggle('is-editing', isEditing);

        if (button) {
            button.classList.toggle('kt-btn--popup-primary', isEditing && !hasEditActions);
            button.setAttribute('aria-pressed', String(isEditing));

            if (!hasEditActions) {
                button.textContent = isEditing ? '편집완료' : '편집';
            }
        }
    };

    const filterMemberRows = input => {
        const template = input.closest('.kt-edit-template');

        if (!template) {
            return;
        }

        const query = input.value.trim().toLowerCase();
        const rows = Array.from(template.querySelectorAll('[data-member-row]'));
        const emptyRow = template.querySelector('[data-member-empty]');
        const count = template.querySelector('[data-member-filter-count]');
        let visibleCount = 0;

        rows.forEach(row => {
            const isMatched = !query || row.textContent.toLowerCase().includes(query);

            row.hidden = !isMatched;

            if (isMatched) {
                visibleCount += 1;
            }
        });

        if (emptyRow) {
            emptyRow.hidden = visibleCount !== 0;
        }

        if (count) {
            count.textContent = String(visibleCount);
        }
    };

    const filterApiRows = input => {
        const template = input.closest('.kt-edit-template');

        if (!template) {
            return;
        }

        const query = input.value.trim().toLowerCase();
        const rows = Array.from(template.querySelectorAll('[data-api-row]'));
        const emptyRow = template.querySelector('[data-api-empty]');
        const count = template.querySelector('[data-api-filter-count]');
        let visibleCount = 0;

        rows.forEach(row => {
            const group = row.dataset.apiAccordion;
            const isMatched = !query || row.textContent.toLowerCase().includes(query);
            const detailRows = group ? template.querySelectorAll(`[data-api-accordion-panel="${group}"]`) : [];

            row.hidden = !isMatched;

            if (isMatched) {
                visibleCount += 1;
            }

            detailRows.forEach(detailRow => {
                detailRow.hidden = !isMatched || !row.classList.contains('is-open');
            });
        });

        if (emptyRow) {
            emptyRow.hidden = visibleCount !== 0;
        }

        if (count) {
            count.textContent = String(visibleCount);
        }
    };

    const createIpRow = value => {
        const row = document.createElement('div');
        const input = document.createElement('input');
        const button = document.createElement('button');
        const img = document.createElement('img');

        row.className = 'kt-env-card__item kt-ldap-ip-editor__row';
        input.type = 'text';
        input.className = 'kt-input kt-input--32';
        input.value = value;
        button.type = 'button';
        button.className = 'kt-ldap-ip-editor__button';
        button.setAttribute('aria-label', 'IP 삭제');
        img.className = 'kt-svg-icon kt-svg-icon--20';
        img.src = '/assets/img/auth/ico_auth_close.svg';
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        button.appendChild(img);
        row.append(input, button);

        return row;
    };

    workspaceRoot.querySelectorAll('[data-ldap-member-search]').forEach(filterMemberRows);
    workspaceRoot.querySelectorAll('[data-ldap-api-search]').forEach(filterApiRows);

    workspaceRoot.addEventListener('input', e => {
        const memberInput = e.target.closest('[data-ldap-member-search]');
        const apiInput = e.target.closest('[data-ldap-api-search]');

        if (memberInput) {
            filterMemberRows(memberInput);
        }

        if (apiInput) {
            filterApiRows(apiInput);
        }
    });

    workspaceRoot.addEventListener('click', e => {
        const actionButton = e.target.closest('[data-edit-cancel], [data-edit-save]');
        const accordionButton = e.target.closest('.kt-row-toggle[data-api-accordion]');
        const ipButton = e.target.closest('.kt-ldap-ip-editor__button');

        if (actionButton) {
            const section = actionButton.closest('.kt-ws-section');

            if (section) {
                e.preventDefault();

                if (section.classList.contains('kt-ldap-section-basic')) {
                    if (actionButton.matches('[data-edit-save]')) {
                        saveBasicInfo(section);
                    } else {
                        resetBasicEditFields(section);
                    }
                }

                setEditMode(section, false);
            }

            return;
        }

        if (accordionButton) {
            const table = accordionButton.closest('.kt-data-table');
            const group = accordionButton.dataset.apiAccordion;
            const row = accordionButton.closest('[data-api-row]') || table?.querySelector(`[data-api-row][data-api-accordion="${group}"]`);

            if (!table || !group || !row) {
                return;
            }

            const isOpen = !row.classList.contains('is-open');

            e.preventDefault();

            row.classList.toggle('is-open', isOpen);
            table.querySelectorAll(`.kt-row-toggle[data-api-accordion="${group}"]`).forEach(button => {
                button.setAttribute('aria-expanded', String(isOpen));
                button.setAttribute('aria-label', isOpen ? 'API 상세 닫기' : 'API 상세 열기');
            });
            table.querySelectorAll(`[data-api-accordion-panel="${group}"]`).forEach(panel => {
                panel.hidden = !isOpen || row.hidden;
            });

            return;
        }

        if (ipButton) {
            const row = ipButton.closest('.kt-ldap-ip-editor__row');
            const editor = ipButton.closest('.kt-ldap-ip-editor');

            if (!row || !editor) {
                return;
            }

            e.preventDefault();

            if (ipButton.classList.contains('kt-ldap-ip-editor__button--add')) {
                const input = row.querySelector('input');
                const value = input.value.trim();

                if (!value) {
                    input.focus({ preventScroll: true });
                    return;
                }

                editor.insertBefore(createIpRow(value), row);
                input.value = '';
                input.focus({ preventScroll: true });
                return;
            }

            row.remove();
            return;
        }

        const button = e.target.closest('.kt-ws-section__head .kt-btn--popup');

        if (!button || button.closest('.kt-btn--popup-line')) {
            return;
        }

        const section = button.closest('.kt-ws-section');
        const template = section ? getEditTemplate(section) : null;

        if (!section || !template) {
            return;
        }

        e.preventDefault();

        const isEditing = !section.classList.contains('is-editing');

        if (isEditing && section.classList.contains('kt-ldap-section-basic')) {
            resetBasicEditFields(section);
        }

        setEditMode(section, isEditing);
    });
})();
