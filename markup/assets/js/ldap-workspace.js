(function () {
    const workspaceRoot = document.querySelector('.kt-ws-popup') || document.querySelector('[data-ldap-components]');

    if (!workspaceRoot) {
        return;
    }

    const getEditTemplate = section => Array.from(section.children).find(child => child.classList.contains('kt-edit-template'));
    const getControlValue = control => (control.value || '').trim();

    const closePrompt = prompt => {
        if (!prompt) {
            return;
        }

        prompt.classList.remove('is-open');
        prompt.querySelectorAll('[data-prompt_trg]').forEach(trigger => {
            trigger.setAttribute('aria-expanded', 'false');
        });
    };

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

    const syncMemberSection = section => {
        const rows = Array.from(section.querySelectorAll('.kt-data-table--members-edit [data-member-row]'));
        const total = rows.length;
        const count = section.querySelector('.kt-ws-section__count strong');
        const readEmptyRow = section.querySelector('[data-member-read-empty]');
        const noDataRow = section.querySelector('[data-member-no-data-empty]');
        const searchEmptyRow = section.querySelector('[data-member-empty]');

        if (count) {
            count.textContent = String(total);
        }

        if (readEmptyRow) {
            readEmptyRow.hidden = total !== 0;
        }

        if (total === 0) {
            if (searchEmptyRow) {
                searchEmptyRow.hidden = true;
            }

            if (noDataRow) {
                noDataRow.hidden = false;
            }

            return;
        }

        if (noDataRow) {
            noDataRow.hidden = true;
        }
    };

    const getMemberData = option => ({
        id: option.dataset.memberId || '',
        name: option.dataset.memberName || option.querySelector('strong')?.textContent.trim() || '',
        email: option.dataset.memberEmail || option.querySelector('span:last-child')?.textContent.trim() || '',
        company: option.dataset.memberCompany || '',
        role: option.dataset.memberRole || 'Member',
        method: option.dataset.memberMethod || 'Owner 초대',
    });

    const createCell = (text, isCenter = true) => {
        const cell = document.createElement('td');

        if (isCenter) {
            cell.className = 'center';
        }

        cell.textContent = text;

        return cell;
    };

    const createRoleBadge = role => {
        const badge = document.createElement('span');
        const roleName = role || 'Member';

        badge.className = 'kt-badge';

        if (roleName === 'Owner') {
            badge.classList.add('kt-badge--role-owner');
        }

        if (roleName === 'Manager') {
            badge.classList.add('kt-badge--role-manager');
        }

        badge.textContent = roleName;

        return badge;
    };

    const insertBeforeEmptyRow = (tbody, row) => {
        const emptyRow = tbody.querySelector('.kt-data-table__empty');

        tbody.insertBefore(row, emptyRow || null);
    };

    const createMemberReadRow = member => {
        const row = document.createElement('tr');
        const roleCell = document.createElement('td');

        row.dataset.memberReadRow = '';
        row.dataset.memberId = member.id;
        roleCell.className = 'center';
        roleCell.appendChild(createRoleBadge(member.role));
        row.append(createCell(member.name), createCell(member.email, false), createCell(member.company), roleCell, createCell(member.method));

        return row;
    };

    const createMemberEditRow = member => {
        const row = document.createElement('tr');
        const roleCell = document.createElement('td');
        const actionCell = document.createElement('td');
        const deleteButton = document.createElement('button');

        row.dataset.memberRow = '';
        row.dataset.memberId = member.id;
        roleCell.className = 'center';
        roleCell.appendChild(createRoleBadge(member.role));
        actionCell.className = 'center';
        deleteButton.type = 'button';
        deleteButton.className = 'kt-member-delete-button';
        deleteButton.dataset.memberDelete = '';
        deleteButton.setAttribute('aria-label', `${member.name} 삭제`);
        deleteButton.textContent = '삭제';
        actionCell.appendChild(deleteButton);
        row.append(createCell(member.name), createCell(member.email, false), createCell(member.company), roleCell, createCell(member.method), actionCell);

        return row;
    };

    const setMemberOptionRegistered = (option, isRegistered) => {
        option.hidden = isRegistered;
        option.setAttribute('aria-hidden', String(isRegistered));
        option.setAttribute('aria-selected', 'false');
        option.classList.remove('is-selected');
        option.tabIndex = isRegistered ? -1 : 0;

        if (isRegistered) {
            option.setAttribute('aria-disabled', 'true');
            option.setAttribute('data-prompt-disabled', 'true');
        } else {
            option.removeAttribute('aria-disabled');
            option.removeAttribute('data-prompt-disabled');
        }
    };

    const clearMemberSearch = section => {
        const input = section.querySelector('[data-ldap-member-search]');

        if (!input) {
            return;
        }

        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        closePrompt(input.closest('[data-prompt]'));
        input.focus({ preventScroll: true });
    };

    const registerMember = option => {
        const section = option.closest('.kt-ldap-section-members');
        const editTableBody = section?.querySelector('.kt-data-table--members-edit tbody');
        const readTableBody = section?.querySelector('.kt-data-table--members:not(.kt-data-table--members-edit) tbody');
        const member = getMemberData(option);

        if (!section || !editTableBody || !readTableBody || !member.id || !member.name || option.hasAttribute('data-prompt-disabled')) {
            return;
        }

        if (section.querySelector(`.kt-data-table--members-edit [data-member-row][data-member-id="${member.id}"]`)) {
            clearMemberSearch(section);
            return;
        }

        insertBeforeEmptyRow(readTableBody, createMemberReadRow(member));
        insertBeforeEmptyRow(editTableBody, createMemberEditRow(member));
        setMemberOptionRegistered(option, true);
        syncMemberSection(section);
        clearMemberSearch(section);
    };

    const getSelectedMemberOption = prompt =>
        Array.from(prompt?.querySelectorAll('[role="option"][data-member-id]') || []).find(option => {
            const isSelected = option.classList.contains('is-selected') || option.getAttribute('aria-selected') === 'true';

            return isSelected && !option.hidden && !option.hasAttribute('data-prompt-disabled');
        });

    const filterMemberRows = input => {
        const template = input.closest('.kt-edit-template');
        const section = input.closest('.kt-ldap-section-members');

        if (!template) {
            return;
        }

        const query = input.value.trim().toLowerCase();
        const rows = Array.from(template.querySelectorAll('[data-member-row]'));
        const emptyRow = template.querySelector('[data-member-empty]');
        const noDataRow = template.querySelector('[data-member-no-data-empty]');
        const count = template.querySelector('[data-member-filter-count]');
        let visibleCount = 0;

        if (!rows.length) {
            if (emptyRow) {
                emptyRow.hidden = true;
            }

            if (noDataRow) {
                noDataRow.hidden = false;
            }

            if (section) {
                syncMemberSection(section);
            }

            return;
        }

        if (noDataRow) {
            noDataRow.hidden = true;
        }

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

        if (section) {
            syncMemberSection(section);
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
    workspaceRoot.querySelectorAll('.kt-ldap-section-members').forEach(syncMemberSection);
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

    workspaceRoot.addEventListener('keydown', e => {
        const memberOption = e.target.closest('[role="option"][data-member-id]');
        const memberInput = e.target.closest('[data-ldap-member-search]');

        if (memberOption && memberOption.closest('.kt-ldap-section-members') && (e.key === 'Enter' || e.key === ' ')) {
            window.setTimeout(() => registerMember(memberOption), 0);
            return;
        }

        if (memberInput && e.key === 'Enter') {
            const option = getSelectedMemberOption(memberInput.closest('[data-prompt]'));

            if (option) {
                window.setTimeout(() => registerMember(option), 0);
            }
        }
    });

    workspaceRoot.addEventListener('click', e => {
        const actionButton = e.target.closest('[data-edit-cancel], [data-edit-save]');
        const accordionButton = e.target.closest('.kt-row-toggle[data-api-accordion]');
        const ipButton = e.target.closest('.kt-ldap-ip-editor__button');
        const memberOption = e.target.closest('[role="option"][data-member-id]');
        const memberDeleteButton = e.target.closest('[data-member-delete]');

        if (memberOption && memberOption.closest('.kt-ldap-section-members')) {
            registerMember(memberOption);
            return;
        }

        if (memberDeleteButton) {
            const row = memberDeleteButton.closest('[data-member-row]');
            const section = memberDeleteButton.closest('.kt-ldap-section-members');
            const memberId = row?.dataset.memberId;

            if (!row || !section) {
                return;
            }

            e.preventDefault();

            row.remove();

            if (memberId) {
                section.querySelectorAll('[data-member-read-row]').forEach(readRow => {
                    if (readRow.dataset.memberId === memberId) {
                        readRow.remove();
                    }
                });

                section.querySelectorAll('[role="option"][data-member-id]').forEach(option => {
                    if (option.dataset.memberId === memberId) {
                        setMemberOptionRegistered(option, false);
                    }
                });
            }

            const input = section.querySelector('[data-ldap-member-search]');

            if (input) {
                filterMemberRows(input);
                closePrompt(input.closest('[data-prompt]'));
            } else {
                syncMemberSection(section);
            }

            return;
        }

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
