(function () {
    const workspaceRoot = document.querySelector('.kt-ws-popup') || document.querySelector('[data-ldap-components]');

    if (!workspaceRoot) {
        return;
    }

    const getEditTemplate = section => Array.from(section.children).find(child => child.classList.contains('kt-edit-template'));
    const getControlValue = control => (control.value || '').trim();
    const toastTimers = new WeakMap();

    const showToast = (toast, message, duration = 1800) => {
        if (!toast) {
            return;
        }

        if (message) {
            toast.textContent = message;
        }

        window.clearTimeout(toastTimers.get(toast));
        toast.hidden = false;
        toast.setAttribute('aria-hidden', 'false');
        // toast.offsetHeight;
        toast.classList.add('is-visible');

        toastTimers.set(
            toast,
            window.setTimeout(() => {
                toast.classList.remove('is-visible');
                toast.setAttribute('aria-hidden', 'true');
                window.setTimeout(() => {
                    if (!toast.classList.contains('is-visible')) {
                        toast.hidden = true;
                    }
                }, 240);
            }, duration),
        );
    };

    const closePrompt = prompt => {
        if (!prompt) {
            return;
        }

        prompt.classList.remove('is-open');
        prompt.querySelectorAll('[data-prompt_trg]').forEach(trigger => {
            trigger.setAttribute('aria-expanded', 'false');
        });
    };

    const closeLdapSearch = search => {
        if (!search) {
            return;
        }

        search.classList.remove('is-open');
        search.querySelectorAll('[data-ldap-search-option].is-active').forEach(option => {
            option.classList.remove('is-active');
        });
        search.querySelectorAll('input[aria-expanded]').forEach(input => {
            input.setAttribute('aria-expanded', 'false');
        });
    };

    const syncLdapSearchClear = search => {
        const input = search.querySelector('input');
        const clear = search.querySelector('[data-ldap-search-clear]');
        const hasValue = Boolean(input?.value.trim());

        if (!clear) {
            return;
        }

        clear.hidden = !hasValue;
        clear.setAttribute('aria-hidden', String(!hasValue));
        clear.tabIndex = hasValue ? 0 : -1;
    };

    const getLdapSearchOptions = search => Array.from(search.querySelectorAll('[data-ldap-search-option]'));

    const isLdapSearchOptionDisabled = option => option.hasAttribute('data-prompt-disabled') || option.getAttribute('aria-disabled') === 'true';

    const filterLdapSearch = search => {
        const input = search.querySelector('input');
        const count = search.querySelector('[data-ldap-search-count]');
        const minLength = Number(search.dataset.minLength || 1);
        const keyword = input?.value.trim().toLowerCase() || '';
        const options = getLdapSearchOptions(search);

        if (keyword.length < minLength) {
            options.forEach(option => {
                option.closest('li').hidden = true;
                option.classList.remove('is-active');
            });

            if (count) {
                count.textContent = '0';
            }

            return [];
        }

        const visibleOptions = options.filter(option => {
            const searchText = (option.dataset.search || option.dataset.searchKeywords || option.textContent || '').toLowerCase();
            const isVisible = !isLdapSearchOptionDisabled(option) && searchText.includes(keyword);

            option.closest('li').hidden = !isVisible;

            if (!isVisible) {
                option.classList.remove('is-active');
            }

            return isVisible;
        });

        if (count) {
            count.textContent = String(visibleOptions.length);
        }

        if (!visibleOptions.some(option => option.classList.contains('is-active'))) {
            visibleOptions[0]?.classList.add('is-active');
        }

        return visibleOptions;
    };

    const openLdapSearch = search => {
        const visibleOptions = filterLdapSearch(search);

        if (visibleOptions.length) {
            search.classList.add('is-open');
            search.querySelectorAll('input[aria-expanded]').forEach(input => {
                input.setAttribute('aria-expanded', 'true');
            });
        } else {
            closeLdapSearch(search);
        }

        syncLdapSearchClear(search);
    };

    const highlightLdapSearchOption = (search, option) => {
        if (!option || option.closest('li')?.hidden) {
            return;
        }

        getLdapSearchOptions(search).forEach(item => item.classList.remove('is-active'));
        option.classList.add('is-active');
        option.scrollIntoView({ block: 'nearest' });
    };

    const setupLdapSearch = search => {
        const input = search.querySelector('input');
        const clear = search.querySelector('[data-ldap-search-clear]');
        const options = getLdapSearchOptions(search);
        const searchType = search.dataset.ldapSearchType;

        if (!input || !options.length) {
            return;
        }

        input.addEventListener('focus', () => openLdapSearch(search));
        input.addEventListener('input', () => {
            openLdapSearch(search);
            syncLdapSearchClear(search);
        });
        input.addEventListener('keydown', event => {
            const visibleOptions = filterLdapSearch(search);
            const currentIndex = visibleOptions.findIndex(option => option.classList.contains('is-active'));

            if (event.key === 'ArrowDown' && visibleOptions.length) {
                event.preventDefault();
                search.classList.add('is-open');
                highlightLdapSearchOption(search, visibleOptions[Math.min(currentIndex + 1, visibleOptions.length - 1)]);
            }

            if (event.key === 'ArrowUp' && visibleOptions.length) {
                event.preventDefault();
                search.classList.add('is-open');
                highlightLdapSearchOption(search, visibleOptions[Math.max(currentIndex - 1, 0)]);
            }

            if (event.key === 'Enter' && visibleOptions.length && searchType === 'member') {
                event.preventDefault();
                registerMember(visibleOptions[Math.max(currentIndex, 0)]);
            }

            if (event.key === 'Escape') {
                closeLdapSearch(search);
            }
        });

        clear?.addEventListener('click', event => {
            event.preventDefault();
            input.value = '';
            filterLdapSearch(search);
            closeLdapSearch(search);
            syncLdapSearchClear(search);
            input.focus({ preventScroll: true });
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });

        options.forEach(option => {
            const checkbox = option.querySelector('[data-api-option-checkbox]');

            option.addEventListener('mouseenter', () => highlightLdapSearchOption(search, option));

            if (searchType === 'member') {
                option.addEventListener('click', event => {
                    event.preventDefault();
                    registerMember(option);
                });
            }

            if (searchType === 'api') {
                checkbox?.addEventListener('change', () => {
                    toggleApiSelection(option, checkbox.checked);
                });
            }

            option.addEventListener('keydown', event => {
                const visibleOptions = filterLdapSearch(search);
                const currentIndex = visibleOptions.indexOf(option);

                if ((event.key === 'Enter' || event.key === ' ') && searchType === 'member') {
                    event.preventDefault();
                    registerMember(option);
                }

                if ((event.key === 'Enter' || event.key === ' ') && searchType === 'api' && checkbox) {
                    event.preventDefault();
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (event.key === 'ArrowDown' && visibleOptions.length) {
                    event.preventDefault();
                    const nextOption = visibleOptions[Math.min(currentIndex + 1, visibleOptions.length - 1)];
                    highlightLdapSearchOption(search, nextOption);
                    nextOption.focus();
                }

                if (event.key === 'ArrowUp' && visibleOptions.length) {
                    event.preventDefault();
                    const prevOption = visibleOptions[Math.max(currentIndex - 1, 0)];
                    highlightLdapSearchOption(search, prevOption);
                    prevOption.focus();
                }

                if (event.key === 'Escape') {
                    closeLdapSearch(search);
                    input.focus({ preventScroll: true });
                }
            });
        });

        filterLdapSearch(search);
        syncLdapSearchClear(search);
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
        option.closest('li').hidden = isRegistered;
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
        const search = input?.closest('[data-ldap-search]');

        if (!input) {
            return;
        }

        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        closeLdapSearch(search);
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

    const getSelectedMemberOption = container =>
        Array.from(container?.querySelectorAll('[data-ldap-search-option][data-member-id], [role="option"][data-member-id]') || []).find(option => {
            const isSelected = option.classList.contains('is-selected') || option.getAttribute('aria-selected') === 'true';

            return isSelected && !option.hidden && !option.closest('li')?.hidden && !option.hasAttribute('data-prompt-disabled');
        });

    const filterMemberRows = input => {
        const template = input.closest('.kt-edit-template');
        const section = input.closest('.kt-ldap-section-members');

        if (!template) {
            return;
        }

        if (input.closest('[data-ldap-search]')) {
            template.querySelectorAll('[data-member-row]').forEach(row => {
                row.hidden = false;
            });
            template.querySelectorAll('[data-member-empty]').forEach(row => {
                row.hidden = true;
            });

            if (section) {
                syncMemberSection(section);
            }

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

    const parseApiParams = params =>
        (params || '')
            .split('|')
            .map(item => item.trim())
            .filter(Boolean)
            .map(item => {
                const [name, sensitivity] = item.split(':').map(value => value.trim());

                return { name, sensitivity: sensitivity || '' };
            });

    const getApiData = option => ({
        id: option.dataset.apiId || '',
        code: option.dataset.apiCode || option.querySelector('strong')?.textContent.trim() || '',
        name: option.dataset.apiName || '',
        prodDomain: option.dataset.apiProdDomain || 'cus-in.api.kt.com',
        devDomain: option.dataset.apiDevDomain || 'cus-in.tbapi.kt.com',
        sensitivity: option.dataset.apiSensitivity || '-',
        selfTesting: option.dataset.apiSelfTesting || '-',
        approval: option.dataset.apiApproval || '대기',
        status: option.dataset.apiStatus || '미상용',
        params: parseApiParams(option.dataset.apiParams),
    });

    const createSelectedApiParam = param => {
        const row = document.createElement('div');
        const label = document.createElement('label');
        const input = document.createElement('input');
        const text = document.createElement('span');

        row.className = 'kt-selected-api__param';
        label.className = 'kt-check';
        input.type = 'checkbox';
        input.checked = true;
        text.textContent = param.name;
        label.append(input, text);
        row.appendChild(label);

        if (param.sensitivity) {
            const sensitive = document.createElement('em');

            sensitive.textContent = param.sensitivity;
            row.appendChild(sensitive);
        }

        return row;
    };

    const createSelectedApi = api => {
        const item = document.createElement('article');
        const summary = document.createElement('div');
        const toggle = document.createElement('button');
        const toggleIcon = document.createElement('img');
        const title = document.createElement('div');
        const code = document.createElement('strong');
        const name = document.createElement('span');
        const sensitivity = document.createElement('span');
        const remove = document.createElement('button');
        const removeIcon = document.createElement('img');
        const detail = document.createElement('div');
        const params = document.createElement('div');
        const paramsTitle = document.createElement('strong');

        item.className = 'kt-selected-api is-open';
        item.dataset.selectedApi = '';
        item.dataset.apiId = api.id;
        item.dataset.apiSensitivity = api.sensitivity;
        summary.className = 'kt-selected-api__summary';
        toggle.type = 'button';
        toggle.className = 'kt-row-toggle';
        toggle.dataset.selectedApiToggle = '';
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', '선택된 API 상세 닫기');
        toggleIcon.className = 'kt-svg-icon';
        toggleIcon.src = '/assets/img/components/ico_chevron_down_16_gray.svg';
        toggleIcon.alt = '';
        toggleIcon.setAttribute('aria-hidden', 'true');
        toggle.appendChild(toggleIcon);
        title.className = 'kt-selected-api__title';
        code.textContent = api.code;
        name.textContent = api.name;
        title.append(code, name);
        sensitivity.className = 'kt-selected-api__sensitive';
        sensitivity.textContent = api.sensitivity;
        remove.type = 'button';
        remove.className = 'kt-selected-api__remove';
        remove.dataset.selectedApiRemove = '';
        remove.setAttribute('aria-label', `${api.code} 삭제`);
        removeIcon.className = 'kt-svg-icon kt-svg-icon--16';
        removeIcon.src = '/assets/img/auth/ico_auth_close.svg';
        removeIcon.alt = '';
        removeIcon.setAttribute('aria-hidden', 'true');
        remove.appendChild(removeIcon);
        summary.append(toggle, title, sensitivity, remove);
        detail.className = 'kt-selected-api__detail';
        detail.dataset.selectedApiPanel = '';
        params.className = 'kt-selected-api__params';
        paramsTitle.textContent = 'Return Parameters (사용할 필드 선택)';
        params.appendChild(paramsTitle);
        (api.params.length ? api.params : [{ name: 'point_balance', sensitivity: '' }]).forEach(param => {
            params.appendChild(createSelectedApiParam(param));
        });
        detail.appendChild(params);
        item.append(summary, detail);

        return item;
    };

    const syncSelectedApiSection = section => {
        const selectedItems = Array.from(section.querySelectorAll('[data-selected-api]'));
        const empty = section.querySelector('[data-api-selected-empty]');
        const notice = section.querySelector('[data-api-sensitive-notice]');
        const addButton = section.querySelector('[data-api-add-to-list]');
        const hasSensitiveApi = selectedItems.some(item => item.dataset.apiSensitivity?.includes('민감'));

        if (empty) {
            empty.hidden = selectedItems.length !== 0;
        }

        if (notice) {
            notice.hidden = !hasSensitiveApi;
        }

        if (addButton) {
            addButton.disabled = !selectedItems.some(item => {
                const option = section.querySelector(`[data-ldap-search-option][data-api-id="${item.dataset.apiId}"]`);

                return option && option.dataset.apiAdded !== 'true';
            });
        }
    };

    const setApiOptionSelected = (option, isSelected) => {
        const checkbox = option.querySelector('[data-api-option-checkbox]');

        option.classList.toggle('is-selected', isSelected);
        option.setAttribute('aria-selected', String(isSelected));

        if (checkbox) {
            checkbox.checked = isSelected;
        }
    };

    const showApiSelectedToast = (section, message, duration = 1800) => {
        showToast(section.querySelector('.kt-ldap-toast-api-edit'), message, duration);
    };

    const toggleApiSelection = (option, isSelected) => {
        const section = option.closest('.kt-ldap-section-api');
        const list = section?.querySelector('[data-api-selected-list]');
        const api = getApiData(option);

        if (!section || !list || !api.id) {
            return;
        }

        const existing = list.querySelector(`[data-selected-api][data-api-id="${api.id}"]`);

        if (isSelected) {
            if (!existing) {
                list.insertBefore(createSelectedApi(api), list.querySelector('[data-api-sensitive-notice]'));
            }

            setApiOptionSelected(option, true);
            syncSelectedApiSection(section);
            return;
        }

        existing?.remove();
        setApiOptionSelected(option, false);
        syncSelectedApiSection(section);
    };

    const removeSelectedApi = button => {
        const item = button.closest('[data-selected-api]');
        const section = button.closest('.kt-ldap-section-api');
        const apiId = item?.dataset.apiId;

        if (!item || !section || !apiId) {
            return;
        }

        section.querySelectorAll(`[data-ldap-search-option][data-api-id="${apiId}"]`).forEach(option => {
            delete option.dataset.apiAdded;
            setApiOptionSelected(option, false);
        });
        item.remove();
        syncApiEditTable(section);
        syncApiReadTable(section);
        syncSelectedApiSection(section);
    };

    const getSelectedApiOptions = section => Array.from(section.querySelectorAll('[data-ldap-search-option][data-api-id].is-selected'));

    const getAddedApiOptions = section => Array.from(section.querySelectorAll('[data-ldap-search-option][data-api-id][data-api-added="true"]'));

    const hasSensitiveApiOption = options => options.some(option => (option.dataset.apiSensitivity || '').includes('민감') || (option.dataset.apiParams || '').includes('민감'));

    const getApiEditTableBody = section => section?.querySelector('.kt-data-table--api-edit tbody') || null;

    const getEditApiId = value => (value || '').replace(/^edit-/, '');

    const syncApiEditTable = section => {
        const body = getApiEditTableBody(section);
        const addedIds = new Set(getAddedApiOptions(section).map(option => option.dataset.apiId));
        const empty = body?.querySelector('[data-api-edit-empty]');

        if (!body) {
            return;
        }

        body.querySelectorAll('[data-api-row]').forEach(row => {
            const apiId = getEditApiId(row.dataset.apiAccordion);
            const isVisible = addedIds.has(apiId);

            row.hidden = !isVisible;

            if (!isVisible) {
                row.classList.remove('is-open');
                row.querySelectorAll('.kt-row-toggle[data-api-accordion]').forEach(button => {
                    button.setAttribute('aria-expanded', 'false');
                    button.setAttribute('aria-label', 'API 상세 열기');
                });
            }
        });

        body.querySelectorAll('[data-api-accordion-panel]').forEach(panel => {
            const apiId = getEditApiId(panel.dataset.apiAccordionPanel);
            const row = body.querySelector(`[data-api-row][data-api-accordion="${panel.dataset.apiAccordionPanel}"]`);

            panel.hidden = !addedIds.has(apiId) || !row?.classList.contains('is-open');
        });

        if (empty) {
            empty.hidden = addedIds.size !== 0;
        }
    };

    const addSelectedApisToList = button => {
        const section = button.closest('.kt-ldap-section-api');
        const selectedOptions = section ? getSelectedApiOptions(section) : [];
        const newOptions = selectedOptions.filter(option => option.dataset.apiAdded !== 'true');

        if (!section || !newOptions.length) {
            return;
        }

        newOptions.forEach(option => {
            option.dataset.apiAdded = 'true';
        });
        syncApiEditTable(section);
        syncApiReadTable(section);
        syncSelectedApiSection(section);
        showApiSelectedToast(section, '선택하신 api가 목록에 추가되었습니다.');

        if (hasSensitiveApiOption(newOptions)) {
            window.setTimeout(() => {
                showApiSelectedToast(section, '민감 파라미터 포함 API가 있습니다. API 승인요청이 필요합니다.', 2200);
            }, 1900);
        }
    };

    const getApiReadTableBody = section => {
        const readWrap = Array.from(section.children).find(child => child.classList.contains('kt-ldap-api-table-wrap'));

        return readWrap?.querySelector('.kt-data-table--api:not(.kt-data-table--api-edit) tbody') || null;
    };

    const createApiBadge = (text, context) => {
        const badge = document.createElement('span');

        badge.className = 'kt-badge';
        badge.textContent = text;

        if (context === 'approval' && text === '승인') {
            badge.classList.add('kt-badge--green');
        }

        if (context === 'approval' && text === '대기') {
            badge.classList.add('kt-badge--warning');
        }

        if (context === 'approval' && text === '반려') {
            badge.classList.add('kt-badge--danger');
        }

        if (context === 'status' && text === '상용') {
            badge.classList.add('kt-badge--prod');
        }

        return badge;
    };

    const createApiNameCell = (api, group) => {
        const cell = document.createElement('td');
        const nameWrap = document.createElement('div');
        const toggle = document.createElement('button');
        const icon = document.createElement('img');
        const text = document.createElement('span');
        const link = document.createElement('a');

        nameWrap.className = 'kt-api-name';
        toggle.type = 'button';
        toggle.className = 'kt-row-toggle';
        toggle.dataset.apiAccordion = group;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'API 상세 열기');
        icon.className = 'kt-svg-icon';
        icon.src = '/assets/img/components/ico_chevron_down_16_gray.svg';
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');
        toggle.appendChild(icon);
        text.className = 'kt-api-name__text';
        text.append(`${api.code} `);
        link.href = '#';
        link.className = 'is-link';
        link.textContent = api.name;
        text.appendChild(link);
        nameWrap.append(toggle, text);
        cell.appendChild(nameWrap);

        return cell;
    };

    const createDomainCell = api => {
        const cell = document.createElement('td');
        const domains = document.createElement('div');
        const prod = document.createElement('span');
        const dev = document.createElement('span');

        domains.className = 'kt-domain-lines';
        prod.textContent = `상용 ${api.prodDomain}`;
        dev.textContent = `개발 ${api.devDomain}`;
        domains.append(prod, dev);
        cell.appendChild(domains);

        return cell;
    };

    const createCenterCell = (content, className = '') => {
        const cell = document.createElement('td');

        cell.className = `center ${className}`.trim();

        if (content instanceof Node) {
            cell.appendChild(content);
        } else {
            cell.textContent = content;
        }

        return cell;
    };

    const createApiDetailRow = (api, group) => {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        const card = document.createElement('div');
        const paramCell = document.createElement('div');
        const params = document.createElement('div');
        const paramsTitle = document.createElement('strong');

        row.className = 'kt-api-detail-row';
        row.dataset.apiAccordionPanel = group;
        row.hidden = true;
        cell.colSpan = 6;
        card.className = 'kt-api-detail-card';
        paramCell.className = 'kt-api-detail-card__cell';
        params.className = 'kt-api-params';
        paramsTitle.textContent = 'Return Parameters';
        params.appendChild(paramsTitle);
        (api.params.length ? api.params : [{ name: '-', sensitivity: '' }]).forEach(param => {
            const paramRow = document.createElement('span');

            if (param.sensitivity) {
                const sensitive = document.createElement('em');

                paramRow.className = 'kt-api-params__row';
                paramRow.append(`${param.name} `);
                sensitive.className = 'kt-api-params__sensitive';
                sensitive.textContent = param.sensitivity;
                paramRow.appendChild(sensitive);
            } else {
                paramRow.textContent = param.name;
            }

            params.appendChild(paramRow);
        });
        paramCell.appendChild(params);
        card.append(
            paramCell,
            (() => {
                const detailDomain = document.createElement('div');
                detailDomain.className = 'kt-api-detail-card__cell';
                detailDomain.appendChild(createDomainCell(api).firstElementChild);
                return detailDomain;
            })(),
            (() => {
                const detailSensitivity = document.createElement('div');
                detailSensitivity.className = `kt-api-detail-card__cell kt-api-detail-card__cell--center ${api.sensitivity === '-' ? 'is-muted' : 'is-danger'}`;
                detailSensitivity.textContent = api.sensitivity;
                return detailSensitivity;
            })(),
            (() => {
                const detailTest = document.createElement('div');
                detailTest.className = 'kt-api-detail-card__cell kt-api-detail-card__cell--center is-muted';
                detailTest.textContent = '-';
                return detailTest;
            })(),
            (() => {
                const detailApproval = document.createElement('div');
                detailApproval.className = 'kt-api-detail-card__cell kt-api-detail-card__cell--center';
                detailApproval.appendChild(createApiBadge(api.approval, 'approval'));
                return detailApproval;
            })(),
            (() => {
                const detailStatus = document.createElement('div');
                detailStatus.className = 'kt-api-detail-card__cell kt-api-detail-card__cell--center';
                detailStatus.appendChild(createApiBadge(api.status, 'status'));
                return detailStatus;
            })(),
        );
        cell.appendChild(card);
        row.appendChild(cell);

        return row;
    };

    const createApiRejectRow = group => {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        const reason = document.createElement('div');
        const tag = document.createElement('span');
        const text = document.createElement('p');

        row.className = 'kt-api-reject-row';
        row.dataset.apiAccordionPanel = group;
        row.hidden = true;
        cell.colSpan = 6;
        reason.className = 'kt-reject-reason';
        tag.className = 'kt-reject-reason__tag';
        tag.textContent = '반려 사유';
        text.textContent = 'IMEI 연관 파라미터(user_id)의 사용 목적이 불명확하므로, 보안성 검토 결과서와 데이터 보존 기간을 함께 제출해 주세요.';
        reason.append(tag, text);
        cell.appendChild(reason);
        row.appendChild(cell);

        return row;
    };

    const createApiEmptyReadRow = () => {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        const empty = document.createElement('div');
        const icon = document.createElement('img');
        const text = document.createElement('p');

        row.className = 'kt-data-table__empty kt-data-table__empty--result';
        cell.colSpan = 6;
        empty.className = 'kt-table-empty-result';
        icon.className = 'kt-svg-icon kt-svg-icon--24';
        icon.src = '/assets/img/contents/ico_warning_empty.svg';
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');
        text.textContent = '등록된 API가 없습니다.';
        empty.append(icon, text);
        cell.appendChild(empty);
        row.appendChild(cell);

        return row;
    };

    const syncApiReadTable = section => {
        const body = getApiReadTableBody(section);
        const selectedOptions = getAddedApiOptions(section);
        const count = section.querySelector('.kt-ws-section__count strong');

        if (!body) {
            return;
        }

        body.replaceChildren();

        if (!selectedOptions.length) {
            body.appendChild(createApiEmptyReadRow());
        } else {
            selectedOptions.forEach(option => {
                const api = getApiData(option);
                const group = `read-${api.id}`;
                const row = document.createElement('tr');

                row.className = 'kt-api-row';
                row.dataset.apiRow = '';
                row.dataset.apiAccordion = group;
                row.append(
                    createApiNameCell(api, group),
                    createDomainCell(api),
                    createCenterCell(api.sensitivity, api.sensitivity === '-' ? 'is-muted' : 'is-danger'),
                    createCenterCell(api.selfTesting, api.selfTesting === 'Completed' ? '' : 'is-muted'),
                    createCenterCell(createApiBadge(api.approval, 'approval')),
                    createCenterCell(createApiBadge(api.status, 'status')),
                );
                body.append(row, createApiDetailRow(api, group));

                if (api.approval === '반려') {
                    body.appendChild(createApiRejectRow(group));
                }
            });
        }

        if (count) {
            count.textContent = String(selectedOptions.length);
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

    workspaceRoot.querySelectorAll('[data-ldap-search]').forEach(setupLdapSearch);
    workspaceRoot.querySelectorAll('[data-ldap-member-search]').forEach(filterMemberRows);
    workspaceRoot.querySelectorAll('.kt-ldap-section-members').forEach(syncMemberSection);
    workspaceRoot.querySelectorAll('.kt-ldap-section-api').forEach(syncSelectedApiSection);
    workspaceRoot.querySelectorAll('[data-ldap-api-search]').forEach(filterApiRows);
    workspaceRoot.querySelectorAll('.kt-ldap-section-api').forEach(syncApiEditTable);

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
        const memberOption = e.target.closest('[data-ldap-search-option][data-member-id], [role="option"][data-member-id]');
        const memberInput = e.target.closest('[data-ldap-member-search]');

        if (memberOption && memberOption.closest('.kt-ldap-section-members') && (e.key === 'Enter' || e.key === ' ')) {
            window.setTimeout(() => registerMember(memberOption), 0);
            return;
        }

        if (memberInput && e.key === 'Enter') {
            const option = getSelectedMemberOption(memberInput.closest('[data-ldap-search]') || memberInput.closest('[data-prompt]'));

            if (option) {
                window.setTimeout(() => registerMember(option), 0);
            }
        }
    });

    workspaceRoot.addEventListener('click', e => {
        const actionButton = e.target.closest('[data-edit-cancel], [data-edit-save]');
        const accordionButton = e.target.closest('.kt-row-toggle[data-api-accordion]');
        const selectedApiToggle = e.target.closest('[data-selected-api-toggle]');
        const selectedApiRemove = e.target.closest('[data-selected-api-remove]');
        const apiAddButton = e.target.closest('[data-api-add-to-list]');
        const apiApprovalButton = e.target.closest('[data-api-approval-request]');
        const apiEmptyAddButton = e.target.closest('[data-api-empty-add]');
        const ipButton = e.target.closest('.kt-ldap-ip-editor__button');
        const memberOption = e.target.closest('[data-ldap-search-option][data-member-id], [role="option"][data-member-id]');
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

        if (apiEmptyAddButton) {
            const section = apiEmptyAddButton.closest('.kt-ldap-section-api');

            if (section) {
                e.preventDefault();
                setEditMode(section, true);
                syncApiEditTable(section);
            }

            return;
        }

        if (apiAddButton) {
            e.preventDefault();
            addSelectedApisToList(apiAddButton);
            return;
        }

        if (apiApprovalButton) {
            const section = apiApprovalButton.closest('.kt-ldap-section-api');

            e.preventDefault();
            showToast(section?.querySelector('.kt-ldap-toast-api'), 'API 추가 승인이 완료되었습니다.');
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

                if (section.classList.contains('kt-ldap-section-api')) {
                    syncApiReadTable(section);
                }

                setEditMode(section, false);
            }

            return;
        }

        if (selectedApiRemove) {
            e.preventDefault();
            removeSelectedApi(selectedApiRemove);
            return;
        }

        if (selectedApiToggle) {
            const item = selectedApiToggle.closest('[data-selected-api]');
            const panel = item?.querySelector('[data-selected-api-panel]');
            const isOpen = !item?.classList.contains('is-open');

            if (!item || !panel) {
                return;
            }

            e.preventDefault();
            item.classList.toggle('is-open', isOpen);
            panel.hidden = !isOpen;
            selectedApiToggle.setAttribute('aria-expanded', String(isOpen));
            selectedApiToggle.setAttribute('aria-label', isOpen ? '선택된 API 상세 닫기' : '선택된 API 상세 열기');
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

        if (!isEditing && section.classList.contains('kt-ldap-section-api')) {
            syncApiReadTable(section);
        }

        setEditMode(section, isEditing);

        if (isEditing && section.classList.contains('kt-ldap-section-api')) {
            syncApiEditTable(section);
        }
    });

    document.addEventListener('click', event => {
        workspaceRoot.querySelectorAll('[data-ldap-search].is-open').forEach(search => {
            if (!search.contains(event.target)) {
                closeLdapSearch(search);
            }
        });
    });
})();
