(function () {
    const workspaceRoot = document.querySelector('.kt-ws-popup') || document.querySelector('[data-ldap-components]');

    if (!workspaceRoot) {
        return;
    }

    const getEditTemplate = section => Array.from(section.children).find(child => child.classList.contains('kt-edit-template'));
    const getControlValue = control => (control.value || '').trim();
    const toastTimers = new WeakMap();
    const apiTooltipTextMap = {
        checkAppSSOBasedTokenId: 'SSO 기반 토큰 ID를 확인합니다.',
        'UserProperty (LDAP)': 'LDAP 사용자 속성 정보를 조회합니다.',
        'CouponPkgSearch (CUPI)': 'CUPI 시스템에서 쿠폰 패키지를 조회합니다.',
        'CouponIssue (CUPI)': 'CUPI 시스템에서 사용자에게 쿠폰을 발급합니다.',
        'CouponStatus (CUPI)': 'CUPI 시스템에서 쿠폰 상태를 조회합니다.',
    };
    let apiTooltipId = 0;

    const getApiTooltipText = apiName => apiTooltipTextMap[apiName] || `${apiName} API 상세 정보를 확인합니다.`;

    const createApiTooltip = text => {
        const tooltip = document.createElement('span');

        tooltip.className = 'kt-tooltip';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.textContent = text;

        return tooltip;
    };

    const ensureApiNameTooltip = nameWrap => {
        const link = nameWrap?.querySelector('.kt-api-name__text .is-link');

        if (!link) {
            return;
        }

        const tooltipText = link.dataset.tooltip || getApiTooltipText(link.textContent.trim());
        let tooltip = nameWrap.querySelector('.kt-tooltip');

        if (!tooltip) {
            tooltip = createApiTooltip(tooltipText);
            nameWrap.appendChild(tooltip);
        } else {
            tooltip.classList.remove('is-visible');
            tooltip.setAttribute('role', 'tooltip');
            tooltip.textContent = tooltipText;
        }

        if (!tooltip.id) {
            apiTooltipId += 1;
            tooltip.id = `kt-api-tooltip-${apiTooltipId}`;
        }

        link.setAttribute('aria-describedby', tooltip.id);
    };

    const positionApiTooltip = link => {
        const tooltip = link?.closest('.kt-api-name')?.querySelector('.kt-tooltip');

        if (!link || !tooltip) {
            return;
        }

        const linkRect = link.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportGap = 8;
        let left = linkRect.left - 16;
        const top = Math.max(viewportGap, linkRect.top - tooltipRect.height - 12);

        if (left + tooltipRect.width > window.innerWidth - viewportGap) {
            left = window.innerWidth - tooltipRect.width - viewportGap;
        }

        left = Math.max(viewportGap, left);

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.setProperty('--kt-tooltip-caret-left', `${Math.max(12, Math.min(tooltipRect.width - 12, linkRect.left + 24 - left))}px`);
    };

    const setApiTooltipVisible = (link, isVisible) => {
        const nameWrap = link?.closest('.kt-api-name');
        const tooltip = nameWrap?.querySelector('.kt-tooltip');

        if (!nameWrap || !tooltip) {
            return;
        }

        nameWrap.classList.toggle('is-tooltip-visible', isVisible);

        if (isVisible) {
            positionApiTooltip(link);
        } else {
            tooltip.style.removeProperty('left');
            tooltip.style.removeProperty('top');
            tooltip.style.removeProperty('--kt-tooltip-caret-left');
        }
    };

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

        section.classList.toggle('has-many-members', total >= 5);

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

    const setSelectedApiOpen = (item, isOpen) => {
        const panel = item?.querySelector('[data-selected-api-panel]');
        const toggle = item?.querySelector('[data-selected-api-toggle]');

        if (!item || !panel) {
            return;
        }

        item.classList.toggle('is-open', isOpen);
        panel.hidden = !isOpen;

        if (toggle) {
            toggle.setAttribute('aria-expanded', String(isOpen));
            toggle.setAttribute('aria-label', isOpen ? '선택된 API 상세 닫기' : '선택된 API 상세 열기');
        }
    };

    const closeSelectedApis = section => {
        section?.querySelectorAll('[data-selected-api]').forEach(item => {
            setSelectedApiOpen(item, false);
        });
    };

    const createSelectedApi = api => {
        const item = document.createElement('li');
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

        item.className = 'kt-selected-api';
        item.dataset.selectedApi = '';
        item.dataset.apiId = api.id;
        item.dataset.apiSensitivity = api.sensitivity;
        summary.className = 'kt-selected-api__summary';
        toggle.type = 'button';
        toggle.className = 'kt-row-toggle';
        toggle.dataset.selectedApiToggle = '';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', '선택된 API 상세 열기');
        toggleIcon.className = 'kt-svg-icon';
        toggleIcon.src = '/assets/img/components/ico_chevron_down_16_gray.svg';
        toggleIcon.alt = '';
        toggleIcon.setAttribute('aria-hidden', 'true');
        toggle.appendChild(toggleIcon);
        title.className = 'kt-selected-api__title';
        code.textContent = api.code;
        name.className = 'kt-selected-api__link';
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
        detail.hidden = true;
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
            closeSelectedApis(section);
            syncSelectedApiSection(section);
            return;
        }

        existing?.remove();
        setApiOptionSelected(option, false);
        closeSelectedApis(section);
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

    const removeAddedApi = button => {
        const row = button.closest('[data-api-row]');
        const section = button.closest('.kt-ldap-section-api');
        const apiId = getEditApiId(row?.dataset.apiAccordion);

        if (!row || !section || !apiId) {
            return;
        }

        section.querySelectorAll(`[data-ldap-search-option][data-api-id="${apiId}"]`).forEach(option => {
            delete option.dataset.apiAdded;
            setApiOptionSelected(option, false);
        });
        section.querySelector(`[data-selected-api][data-api-id="${apiId}"]`)?.remove();
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

    const apiBadgeClassMap = {
        재신청: 'kt-badge--blue',
        상용: 'kt-badge--prod',
        승인: 'kt-badge--green',
        호출제한: 'kt-badge--danger',
        대기: 'kt-badge--warning',
        반려: 'kt-badge--danger',
    };

    const createApiBadge = text => {
        const badge = document.createElement('span');
        const badgeClass = apiBadgeClassMap[text];

        badge.className = 'kt-badge';
        badge.textContent = text;

        if (badgeClass) {
            badge.classList.add(badgeClass);
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
        ensureApiNameTooltip(nameWrap);
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
        const reason = document.createElement('li');
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
        const table = body?.closest('.kt-data-table--api');

        if (!body) {
            return;
        }

        section.classList.toggle('has-many-api-rows', selectedOptions.length >= 5);
        table?.classList.toggle('kt-data-table--api-scroll', selectedOptions.length >= 5);
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

    const getIpReadGrid = section => Array.from(section.children).find(child => child.classList.contains('kt-panel-grid'));

    const getIpReadCard = (section, env) => getIpReadGrid(section)?.querySelector(`[data-ip-env="${env}"]`) || null;

    const ipBadgeClassMap = {
        대기: 'kt-badge--warning',
        승인: 'kt-badge--green',
        반려: 'kt-badge--danger',
    };
    const ipStatusOrder = {
        대기: 0,
        승인: 1,
        반려: 2,
    };
    // 임시: 기획 확정 전 행 추가 시 상태 배지를 대기 -> 승인 -> 반려 순서로 순환 노출합니다.
    const temporaryIpStatusCycle = ['대기', '승인', '반려'];
    const getTemporaryIpStatus = editor => temporaryIpStatusCycle[editor.querySelectorAll('[data-ip-editor-item]').length % temporaryIpStatusCycle.length];

    const createIpBadge = (status = '대기') => {
        const badge = document.createElement('span');
        const badgeClass = ipBadgeClassMap[status];

        badge.className = 'kt-badge';
        badge.textContent = status;

        if (badgeClass) {
            badge.classList.add(badgeClass);
        }

        return badge;
    };

    const createIpRejectReason = text => {
        const reason = document.createElement('li');
        const tag = document.createElement('span');
        const paragraph = document.createElement('p');

        // 임시: 반려 시 편집완료 디자인에서 반려 사유가 포함된 반려 디자인으로도 전환됩니다.
        reason.className = 'kt-reject-reason kt-reject-reason--ip';
        tag.className = 'kt-reject-reason__tag';
        tag.textContent = '반려 사유';
        paragraph.textContent = text || '등록 요청 IP 대역이 내부 보안 정책에 부합하지 않습니다.';
        reason.append(tag, paragraph);

        return reason;
    };

    const createIpReadItem = (value, status = '대기') => {
        const item = document.createElement('li');
        const text = document.createElement('span');

        item.className = 'kt-env-card__item';
        item.dataset.ipValue = value;
        item.dataset.ipStatus = status;
        text.textContent = value;
        item.append(text, createIpBadge(status));

        return item;
    };

    const createIpRemoveButton = value => {
        const button = document.createElement('button');
        const icon = document.createElement('img');

        button.type = 'button';
        button.className = 'kt-ldap-ip-editor__button kt-ldap-ip-editor__button--remove';
        button.setAttribute('aria-label', `${value} 삭제`);
        icon.className = 'kt-svg-icon';
        icon.src = '/assets/img/contents/ico_tool_minus.svg';
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');
        button.appendChild(icon);

        return button;
    };

    const createIpEditorItem = (value, status = '대기', reason = '') => {
        const item = document.createElement('li');
        const input = document.createElement('input');

        item.className = 'kt-ldap-ip-editor__row kt-ldap-ip-editor__row--item';
        item.dataset.ipEditorItem = '';
        item.dataset.ipValue = value;
        item.dataset.ipStatus = status;
        item.dataset.ipRejectReason = reason;
        input.type = 'text';
        input.className = 'kt-input kt-input--32';
        input.inputMode = 'decimal';
        input.placeholder = '예) 211.11.10.92';
        input.value = value;
        item.append(input, createIpRemoveButton(value));

        return item;
    };

    const getIpReadValues = card => {
        const values = [];
        const list = card?.querySelector('.kt-env-card__list');
        let lastValue = null;

        Array.from(list?.children || []).forEach(child => {
            if (child.classList.contains('kt-env-card__item')) {
                lastValue = {
                    value: child.dataset.ipValue || child.querySelector('span:first-child')?.textContent.trim() || '',
                    status: child.dataset.ipStatus || child.querySelector('.kt-badge')?.textContent.trim() || '대기',
                    reason: '',
                };
                values.push(lastValue);
                return;
            }

            if (child.classList.contains('kt-reject-reason') && lastValue?.status === '반려') {
                lastValue.reason = child.querySelector('p')?.textContent.trim() || '';
            }
        });

        return values;
    };

    const ensureIpReadList = card => {
        let body = card?.querySelector(':scope > .kt-env-card__body');
        let list = body?.querySelector('.kt-env-card__list');

        if (!card) {
            return null;
        }

        if (!body) {
            body = document.createElement('div');
            body.className = 'kt-env-card__body';
            card.appendChild(body);
        }

        if (!list) {
            list = document.createElement('ul');
            list.className = 'kt-env-card__list';
            body.appendChild(list);
        }

        return list;
    };

    const syncIpReadCardState = card => {
        const empty = card?.querySelector(':scope > .kt-env-card__empty');
        const body = card?.querySelector(':scope > .kt-env-card__body');
        const list = body?.querySelector('.kt-env-card__list');
        const hasItems = Boolean(list?.querySelector('.kt-env-card__item'));

        if (empty) {
            empty.hidden = hasItems;
            empty.style.display = hasItems ? 'none' : 'flex';
        }

        if (body) {
            body.hidden = !hasItems;
            body.style.display = hasItems ? '' : 'none';
        }
    };

    const addIpToReadCard = (section, env, value, status = '대기', reason = '') => {
        const ip = value.trim();
        const card = getIpReadCard(section, env);
        const list = ensureIpReadList(card);
        const exists = Array.from(list?.querySelectorAll('.kt-env-card__item > span:first-child') || []).some(item => item.textContent.trim() === ip);

        if (!section || !env || !ip || !card || !list || exists) {
            return false;
        }

        list.appendChild(createIpReadItem(ip, status));

        if (status === '반려') {
            list.appendChild(createIpRejectReason(reason));
        }

        syncIpReadCardState(card);

        return true;
    };

    const clearIpReadCard = (section, env) => {
        const card = getIpReadCard(section, env);
        const list = ensureIpReadList(card);

        list?.replaceChildren();
        syncIpReadCardState(card);
    };

    const sortIpReadList = list => {
        const entries = [];
        let lastEntry = null;

        Array.from(list?.children || []).forEach(child => {
            if (child.classList.contains('kt-env-card__item')) {
                lastEntry = {
                    item: child,
                    reason: null,
                    status: child.dataset.ipStatus || child.querySelector('.kt-badge')?.textContent.trim() || '대기',
                    index: entries.length,
                };
                entries.push(lastEntry);
                return;
            }

            if (child.classList.contains('kt-reject-reason') && lastEntry?.status === '반려') {
                lastEntry.reason = child;
            }
        });

        entries
            .sort((a, b) => (ipStatusOrder[a.status] ?? 99) - (ipStatusOrder[b.status] ?? 99) || a.index - b.index)
            .forEach(entry => {
                list.appendChild(entry.item);

                if (entry.reason) {
                    list.appendChild(entry.reason);
                }
            });
    };

    const sortIpReadCard = card => {
        const list = card?.querySelector('.kt-env-card__list');

        if (list) {
            sortIpReadList(list);
        }
    };

    const getIpEditorInputRow = editor => editor.querySelector('.kt-ldap-ip-editor__row:not([data-ip-editor-item])');

    const getIpEditorValues = editor =>
        Array.from(editor.querySelectorAll('[data-ip-editor-item]')).map(item => ({
            value: item.querySelector('input')?.value.trim() || item.dataset.ipValue || '',
            status: item.dataset.ipStatus || '대기',
            reason: item.dataset.ipRejectReason || '',
        }));

    const hasIpEditorValue = (editor, value) => getIpEditorValues(editor).some(item => item.value === value);

    const addIpEditorValue = editor => {
        const inputRow = getIpEditorInputRow(editor);
        const input = inputRow?.querySelector('input');
        const value = input?.value.trim() || '';

        if (!editor || !inputRow || !input) {
            return false;
        }

        if (!value || hasIpEditorValue(editor, value)) {
            return false;
        }

        editor.insertBefore(createIpEditorItem(value, getTemporaryIpStatus(editor)), inputRow);
        input.value = '';

        return true;
    };

    const syncIpWhitelist = section => {
        section.querySelectorAll('.kt-edit-template .kt-ldap-ip-editor').forEach(editor => {
            const env = editor.dataset.ipEnv || editor.closest('[data-ip-env]')?.dataset.ipEnv;

            addIpEditorValue(editor);
            clearIpReadCard(section, env);
            getIpEditorValues(editor).forEach(item => {
                addIpToReadCard(section, env, item.value, item.status, item.reason);
            });
        });

        getIpReadGrid(section)
            ?.querySelectorAll('[data-ip-env]')
            .forEach(card => {
                sortIpReadCard(card);
                syncIpReadCardState(card);
            });
    };

    const resetIpEditors = section => {
        section.querySelectorAll('.kt-edit-template [data-ip-editor-item]').forEach(item => {
            item.remove();
        });

        section.querySelectorAll('.kt-edit-template .kt-ldap-ip-editor input').forEach(input => {
            input.value = '';
        });
    };

    const restoreIpEditors = section => {
        resetIpEditors(section);

        section.querySelectorAll('.kt-edit-template .kt-ldap-ip-editor').forEach(editor => {
            const env = editor.dataset.ipEnv || editor.closest('[data-ip-env]')?.dataset.ipEnv;
            const inputRow = getIpEditorInputRow(editor);
            const readValues = getIpReadValues(getIpReadCard(section, env));

            if (!inputRow) {
                return;
            }

            readValues.forEach(item => {
                if (item.value) {
                    editor.insertBefore(createIpEditorItem(item.value, item.status, item.reason), inputRow);
                }
            });
        });
    };

    workspaceRoot.querySelectorAll('[data-ldap-search]').forEach(setupLdapSearch);
    workspaceRoot.querySelectorAll('[data-ldap-member-search]').forEach(filterMemberRows);
    workspaceRoot.querySelectorAll('.kt-ldap-section-members').forEach(syncMemberSection);
    workspaceRoot.querySelectorAll('.kt-ldap-section-api').forEach(syncSelectedApiSection);
    workspaceRoot.querySelectorAll('[data-ldap-api-search]').forEach(filterApiRows);
    workspaceRoot.querySelectorAll('.kt-ldap-section-api').forEach(syncApiEditTable);
    workspaceRoot.querySelectorAll('.kt-api-name').forEach(ensureApiNameTooltip);
    workspaceRoot.querySelectorAll('.kt-ldap-section-ip-empty, .kt-ldap-section-ip-filled').forEach(section => {
        getIpReadGrid(section)?.querySelectorAll('[data-ip-env]').forEach(sortIpReadCard);
    });

    workspaceRoot.addEventListener('input', e => {
        const memberInput = e.target.closest('[data-ldap-member-search]');
        const apiInput = e.target.closest('[data-ldap-api-search]');
        const ipInput = e.target.closest('.kt-ldap-ip-editor input');

        if (memberInput) {
            filterMemberRows(memberInput);
        }

        if (apiInput) {
            filterApiRows(apiInput);
        }

        if (ipInput) {
            ipInput.value = ipInput.value.replace(/[^0-9.]/g, '');

            if (ipInput.closest('[data-ip-editor-item]')) {
                const item = ipInput.closest('[data-ip-editor-item]');

                item.dataset.ipValue = ipInput.value.trim();
                item.querySelector('.kt-ldap-ip-editor__button--remove')?.setAttribute('aria-label', `${item.dataset.ipValue} 삭제`);
            }
        }
    });

    workspaceRoot.addEventListener('mouseover', e => {
        const apiNameLink = e.target.closest('.kt-api-name .is-link');

        if (apiNameLink) {
            setApiTooltipVisible(apiNameLink, true);
        }
    });

    workspaceRoot.addEventListener('mouseout', e => {
        const apiNameLink = e.target.closest('.kt-api-name .is-link');

        if (apiNameLink && !apiNameLink.contains(e.relatedTarget)) {
            setApiTooltipVisible(apiNameLink, false);
        }
    });

    workspaceRoot.addEventListener('focusin', e => {
        const apiNameLink = e.target.closest('.kt-api-name .is-link');

        if (apiNameLink) {
            setApiTooltipVisible(apiNameLink, true);
        }
    });

    workspaceRoot.addEventListener('focusout', e => {
        const apiNameLink = e.target.closest('.kt-api-name .is-link');

        if (apiNameLink) {
            setApiTooltipVisible(apiNameLink, false);
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
        const apiEditDeleteButton = e.target.closest('[data-api-edit-delete]');
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
            e.stopPropagation();
            addSelectedApisToList(apiAddButton);
            return;
        }

        if (apiEditDeleteButton) {
            e.preventDefault();
            removeAddedApi(apiEditDeleteButton);
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

                if (section.classList.contains('kt-ldap-section-ip-empty') || section.classList.contains('kt-ldap-section-ip-filled')) {
                    if (actionButton.matches('[data-edit-save]')) {
                        syncIpWhitelist(section);
                    } else {
                        resetIpEditors(section);
                    }
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
            const isOpen = !item?.classList.contains('is-open');

            if (!item) {
                return;
            }

            e.preventDefault();
            setSelectedApiOpen(item, isOpen);
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
                const isAdded = addIpEditorValue(editor);

                if (!isAdded) {
                    input.focus({ preventScroll: true });
                    return;
                }

                input.focus({ preventScroll: true });
                return;
            }

            if (ipButton.classList.contains('kt-ldap-ip-editor__button--remove')) {
                row.remove();
                getIpEditorInputRow(editor)?.querySelector('input')?.focus({ preventScroll: true });
                return;
            }

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

        if (isEditing && (section.classList.contains('kt-ldap-section-ip-empty') || section.classList.contains('kt-ldap-section-ip-filled'))) {
            restoreIpEditors(section);
        }

        if (!isEditing && (section.classList.contains('kt-ldap-section-ip-empty') || section.classList.contains('kt-ldap-section-ip-filled'))) {
            syncIpWhitelist(section);
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
