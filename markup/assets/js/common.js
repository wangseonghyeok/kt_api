let scrollY;
let wrap;
let scrollP;

function syncHeight() {
    document.documentElement.style.setProperty('--window-inner-height', `${window.innerHeight}px`);
}

function bodyLock() {
    scrollY = window.scrollY;
    document.documentElement.classList.add('is-locked');
    if (wrap) {
        wrap.style.top = `-${scrollY}px`;
    }
}

function bodyUnlock() {
    const isLocked = document.documentElement.classList.contains('is-locked');

    document.documentElement.classList.remove('is-locked');
    if (wrap) {
        wrap.style.top = '';
    }
    if (isLocked) {
        window.scrollTo(0, scrollY || 0);
    }
}

let activePopupTrigger = null;

function getPopup(obj) {
    if (!obj) {
        return null;
    }

    if (typeof obj === 'string') {
        return document.querySelector(obj);
    }

    return obj.classList?.contains('popup') ? obj : obj.closest?.('.popup');
}

function openPopup(popup, trigger) {
    if (!popup) {
        return;
    }

    activePopupTrigger = trigger || document.activeElement;
    popup.hidden = false;
    popup.setAttribute('aria-hidden', 'false');
    popup.classList.add('is-active');

    if (window.jQuery) {
        $(popup).stop(true, true).fadeIn('fast');
    } else {
        popup.style.display = 'block';
    }

    bodyLock();

    window.setTimeout(() => {
        const focusTarget = popup.querySelector('[data-popup-focus], .kt-auth-close, .popup__close, button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');

        focusTarget?.focus();
    }, 0);
}

function closePopup(popup) {
    if (!popup) {
        return;
    }

    const afterClose = () => {
        popup.classList.remove('is-active');
        popup.hidden = true;
        popup.setAttribute('aria-hidden', 'true');
        bodyUnlock();

        if (activePopupTrigger && document.contains(activePopupTrigger)) {
            activePopupTrigger.focus();
        }
        activePopupTrigger = null;
    };

    if (window.jQuery) {
        $(popup).stop(true, true).fadeOut('fast', afterClose);
    } else {
        popup.style.display = 'none';
        afterClose();
    }
}

function popOpen(target, trigger) {
    openPopup(getPopup(target), trigger);
}

function popClose(obj) {
    closePopup(getPopup(obj));
}

function scrollHeader() {
    scrollP = $(window).scrollTop();
    if (scrollP > 50) {
        $('#header').addClass('__scrolled');
    } else {
        $('#header').removeClass('__scrolled');
    }
}

function scrollTopBtn() {
    scrollP = $(window).scrollTop();
    if (scrollP > 50) {
        $('.top-btn-wrap').fadeIn('fast');
    } else {
        $('.top-btn-wrap').fadeOut('fast');
    }
    if ($('#footer').length) {
        if ($(window).scrollTop() + $(window).innerHeight() > $('#footer').offset().top) {
            $('.top-btn-wrap').addClass('__abs');
        } else {
            $('.top-btn-wrap').removeClass('__abs');
        }
    }
}

function getTextareaCountTarget(textarea) {
    const targetId = textarea.dataset.textareaCount || textarea.dataset.inquiryCount;

    if (targetId) {
        return document.getElementById(targetId);
    }

    return textarea
        .closest('.kt-textarea-wrap, .kt-inquiry-textarea, .kt-newwork-field--textarea, .kt-field')
        ?.querySelector('[data-textarea-count-output], .kt-textarea__count, .kt-inquiry-textarea__count, i');
}

function syncTextareaCount(textarea) {
    const target = getTextareaCountTarget(textarea);

    if (!target) {
        return;
    }

    const max = textarea.getAttribute('maxlength') || target.dataset.textareaMax || target.textContent.split('/')[1]?.trim() || '0';
    target.textContent = `${textarea.value.length}/${max}`;
}

const ui = {
    // 공통 드롭다운/셀렉트박스 열림, 닫힘, 선택값 동기화
    dropdown: () => {
        const dropWrap = document.querySelectorAll('[data-dropdown_wrap]');

        dropWrap.forEach(e => {
            const dropTrg = e.querySelector('[data-dropdown_trg]');
            const dropMenu = e.querySelector('[data-dropdown_menu]');

            if (!dropTrg || !dropMenu) {
                return;
            }

            const dropItem = dropMenu.querySelectorAll('a, button');

            const hideDropMenu = () => {
                dropTrg.classList.remove('__open', '__up', '__down');
                dropTrg.setAttribute('aria-selected', false);
                dropTrg.setAttribute('aria-expanded', false);
            };
            const showDropMenu = () => {
                dropTrg.classList.add('__open');
                dropTrg.setAttribute('aria-selected', true);
                dropTrg.setAttribute('aria-expanded', true);

                dropTrg.classList.add('__down');
                dropMenu.style.top = `${dropTrg.clientHeight + 10}px`;
            };
            if (e.classList.contains('selectbox')) {
                dropItem.forEach(el => {
                    el.addEventListener('click', () => {
                        for (let i = 0; i < dropItem.length; i++) {
                            dropItem[i].removeAttribute('aria-current');
                        }
                        const txt = el.innerText;
                        dropTrg.innerText = txt;
                        el.setAttribute('aria-current', 'true');
                        hideDropMenu();
                    });
                });
            }
            dropTrg.addEventListener('click', () => {
                if (dropTrg.disabled) {
                    return;
                }

                if (dropTrg.classList.contains('__open')) {
                    hideDropMenu();
                } else {
                    $('[data-dropdown_wrap] [data-dropdown_trg][aria-expanded="true"]').removeClass('__open');
                    $('[data-dropdown_wrap] [data-dropdown_trg][aria-expanded="true"]').attr('aria-selected', 'false').attr('aria-expanded', 'false');
                    showDropMenu();
                }
            });
            dropTrg.addEventListener('focus', () => {
                if (!dropTrg.disabled && !dropTrg.classList.contains('__open')) {
                    setTimeout(() => {
                        showDropMenu();
                    }, 100);
                }
            });
            // 외부 클릭 시 열린 드롭다운 닫기
            $(document).mouseup(elm => {
                if ($('[data-dropdown_trg].__open').length) {
                    const drop = $('[data-dropdown_wrap]');
                    if (drop.has(elm.target).length === 0) {
                        drop.find('[data-dropdown_trg]').removeClass('__open __up __down');
                        dropTrg.setAttribute('aria-selected', 'false');
                        dropTrg.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });
    },
    // FAQ/문의 등 공통 아코디언
    accordion: () => {
        $('[data-accordion]').each(function () {
            const others = $(this).find('[data-accordion_cont][aria-hidden]');
            const btn = $(this).find('[data-accordion_trg] > button[aria-controls]');
            const duration = Number($(this).attr('data-accordion-duration')) || 320;
            btn.on('click', function () {
                const expanded = $(this).attr('aria-expanded');
                const cont = $(this).attr('aria-controls');
                const target = $('#' + cont);

                if (!target.length || !target.children().length) {
                    return;
                }

                if (expanded === 'true') {
                    $(this).attr('aria-expanded', 'false');
                    target.stop(true, false).slideUp(duration, 'swing', () => {
                        target.attr('aria-hidden', 'true').removeAttr('style');
                    });
                } else {
                    btn.attr('aria-expanded', 'false');
                    $(this).attr('aria-expanded', 'true');
                    others.not(target).each(function () {
                        const panel = $(this);
                        panel.stop(true, false).slideUp(duration, 'swing', () => {
                            panel.attr('aria-hidden', 'true').removeAttr('style');
                        });
                    });
                    target
                        .stop(true, false)
                        .attr('aria-hidden', 'false')
                        .hide()
                        .slideDown(duration, 'swing', () => {
                            target.removeAttr('style');
                        });
                }
            });
        });
    },
    // Support 페이지의 라인 탭
    supportTabs: () => {
        document.querySelectorAll('[data-support-tabs]').forEach(tabWrap => {
            const tabs = tabWrap.querySelectorAll('[data-support-tab]');
            const panels = tabWrap.querySelectorAll('[data-support-panel]');

            tabs.forEach(tab => {
                tab.addEventListener('click', event => {
                    event.preventDefault();

                    const tabName = tab.getAttribute('data-support-tab');
                    tabs.forEach(item => {
                        item.classList.remove('is-active');
                        item.setAttribute('aria-selected', 'false');
                        item.removeAttribute('aria-current');
                    });
                    tab.classList.add('is-active');
                    tab.setAttribute('aria-selected', 'true');
                    tab.setAttribute('aria-current', 'page');

                    panels.forEach(panel => {
                        if (panel.getAttribute('data-support-panel') === tabName && panel.textContent.trim()) {
                            panel.removeAttribute('hidden');
                        } else {
                            panel.setAttribute('hidden', '');
                        }
                    });
                });
            });
        });
    },
    // Support 문의 폼: 글자수, 파일명, 답변 영역 상태
    textareaCounter: () => {
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', () => syncTextareaCount(textarea));
            syncTextareaCount(textarea);
        });
    },
    // Support inquiry file, answer, and table states
    supportInquiry: () => {
        document.querySelectorAll('.kt-inquiry-form').forEach(form => {
            form.addEventListener('submit', event => event.preventDefault());
        });

        document.querySelectorAll('[data-inquiry-table-fade]').forEach(tableScroll => {
            const scrollBody = tableScroll.querySelector('tbody');

            if (!scrollBody) {
                return;
            }

            const syncTableFade = () => {
                const isScrollEnd = scrollBody.scrollTop + scrollBody.clientHeight >= scrollBody.scrollHeight - 1;
                tableScroll.classList.toggle('is-scroll-end', isScrollEnd);
            };

            scrollBody.addEventListener('scroll', syncTableFade, { passive: true });
            syncTableFade();
        });

        document.querySelectorAll('[data-inquiry-file]').forEach(field => {
            const input = field.querySelector('input[type="file"]');
            const name = field.querySelector('[data-inquiry-file-name]');
            const clear = field.querySelector('[data-inquiry-file-clear]');
            const icon = name?.querySelector('[data-inquiry-file-icon]');
            const defaultText = name?.textContent.trim() || '';

            if (!input || !name) {
                return;
            }

            const setName = (text, hasFile) => {
                name.replaceChildren();
                if (icon) {
                    name.appendChild(icon);
                }
                name.append(text);
                field.classList.toggle('has-file', hasFile);
                if (clear) {
                    clear.hidden = !hasFile;
                }
            };

            input.addEventListener('change', () => {
                const fileName = input.files && input.files.length ? input.files[0].name : '';
                setName(fileName || defaultText, Boolean(fileName));
            });

            clear?.addEventListener('click', () => {
                input.value = '';
                setName(defaultText, false);
                input.focus();
            });

            setName(defaultText, false);
        });

        document.querySelectorAll('[data-inquiry-answer-wrap]').forEach(answerWrap => {
            const answer = answerWrap.querySelector('[data-inquiry-answer-container]');
            const defaultActions = answerWrap.querySelector('[data-inquiry-default-actions]');
            const openButton = answerWrap.querySelector('[data-inquiry-answer-open]');
            const cancelButton = answerWrap.querySelector('[data-inquiry-answer-cancel]');
            const answerInput = answer?.querySelector('textarea');

            if (!answer || !openButton) {
                return;
            }

            openButton.addEventListener('click', () => {
                answer.hidden = false;
                defaultActions?.setAttribute('hidden', '');
                answerInput?.focus();
                if (answerInput) {
                    syncTextareaCount(answerInput);
                }
            });

            cancelButton?.addEventListener('click', () => {
                answer.hidden = true;
                defaultActions?.removeAttribute('hidden');
                openButton.focus();
            });
        });
    },
    // 페이지네이션 현재 페이지 표시
    pagination: () => {
        $('[data-pagination] ul > li > a').on('click', function () {
            $('[data-pagination] ul > li > a').removeAttr('aria-current');
            $(this).attr('aria-current', 'true');
        });
    },
    popupContent: root => {
        if (!root) {
            return;
        }

        root.querySelectorAll('[data-auth-main-tabs]').forEach(tabWrap => {
            const mainTabs = tabWrap.querySelectorAll('[data-auth-main-tab]');
            const mainPanels = tabWrap.querySelectorAll('[data-auth-main-panel]');

            mainTabs.forEach(tab => {
                tab.addEventListener('click', event => {
                    event.preventDefault();

                    const targetName = tab.dataset.authMainTab;

                    mainTabs.forEach(item => {
                        item.classList.toggle('is-active', item === tab);
                    });

                    mainPanels.forEach(panel => {
                        const isTarget = panel.dataset.authMainPanel === targetName;

                        panel.classList.toggle('is-active', isTarget);
                        panel.hidden = !isTarget;
                        panel.setAttribute('aria-hidden', String(!isTarget));
                    });
                });
            });
        });

        root.querySelectorAll('[data-auth-tabs]').forEach(tabWrap => {
            const tabLinks = tabWrap.querySelectorAll('[data-auth-tab]');
            const tabPanels = tabWrap.querySelectorAll('[data-auth-panel]');

            tabLinks.forEach(link => {
                link.addEventListener('click', event => {
                    event.preventDefault();

                    const targetName = link.dataset.authTab;
                    const targetPanel = tabWrap.querySelector(`[data-auth-panel="${targetName}"]`);

                    tabLinks.forEach(item => {
                        item.classList.toggle('is-active', item === link);
                    });

                    if (!targetPanel) {
                        return;
                    }

                    tabPanels.forEach(panel => {
                        const isTarget = panel === targetPanel;

                        panel.hidden = !isTarget;
                        panel.setAttribute('aria-hidden', String(!isTarget));
                    });
                });
            });
        });

        root.querySelectorAll('.kt-auth-methods').forEach(methodWrap => {
            const authContent = methodWrap.closest('.kt-auth-content');
            const methodPanels = authContent ? authContent.querySelectorAll('.kt-auth-panels > li') : [];

            methodWrap.querySelectorAll('.kt-auth-method[href="#"]').forEach(method => {
                method.addEventListener('click', event => {
                    event.preventDefault();

                    methodWrap.querySelectorAll('.kt-auth-method').forEach(item => {
                        item.classList.toggle('is-active', item === method);
                    });

                    if (!methodPanels.length || !method.dataset.authMethod) {
                        return;
                    }

                    methodPanels.forEach(panel => {
                        panel.classList.toggle('is-active', panel.dataset.authPanel === method.dataset.authMethod);
                    });
                });
            });
        });

        root.querySelectorAll('[data-password_toggle]').forEach(button => {
            const inputId = button.getAttribute('aria-controls');
            const input = (inputId && root.querySelector(`#${inputId}`)) || button.closest('.kt-password')?.querySelector('input');
            const icon = button.querySelector('img');
            const showIcon = button.dataset.iconShow;
            const hideIcon = button.dataset.iconHide;

            if (!input) {
                return;
            }

            const syncToggleState = () => {
                const isVisible = input.type === 'text';

                button.setAttribute('aria-pressed', String(isVisible));
                button.setAttribute('aria-label', isVisible ? '비밀번호 숨기기' : '비밀번호 보기');

                if (icon && showIcon && hideIcon) {
                    icon.src = isVisible ? showIcon : hideIcon;
                }
            };

            syncToggleState();

            button.addEventListener('click', () => {
                input.type = input.type === 'password' ? 'text' : 'password';
                syncToggleState();
            });
        });

        root.querySelectorAll('[data-clear_input]').forEach(button => {
            const inputId = button.getAttribute('aria-controls');
            const input = (inputId && root.querySelector(`#${inputId}`)) || button.closest('.kt-input-field, .kt-password, .kt-search, .kt-user-verify__box, .kt-auth-verify')?.querySelector('input');

            if (!input) {
                return;
            }

            button.addEventListener('click', () => {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
            });
        });

        root.querySelectorAll('.kt-input-field, .kt-password, .kt-search, .kt-user-verify__box, .kt-auth-verify').forEach(field => {
            const input = field.querySelector('input');
            const clearButton = field.querySelector('[data-clear_input]');

            if (!input || !clearButton) {
                return;
            }

            const syncClearButton = () => {
                const hasValue = input.value.trim().length > 0;

                field.classList.toggle('has-value', hasValue);
                clearButton.hidden = !hasValue;
                clearButton.setAttribute('aria-hidden', String(!hasValue));
                clearButton.tabIndex = hasValue ? 0 : -1;
            };

            input.addEventListener('input', syncClearButton);
            input.addEventListener('change', syncClearButton);
            input.addEventListener('compositionend', syncClearButton);
            input.addEventListener('keyup', syncClearButton);
            syncClearButton();
        });
    },
    popup: () => {
        const setLoading = popup => {
            const content = popup.querySelector('[data-popup-content]');

            if (content) {
                content.innerHTML = '<div class="kt-popup-loading" role="status">팝업을 불러오는 중입니다.</div>';
            }
        };

        const loadRemotePopup = async (trigger, popup) => {
            const content = popup.querySelector('[data-popup-content]');
            const url = trigger.dataset.popupUrl;

            if (!content || !url) {
                return;
            }

            setLoading(popup);

            try {
                const response = await fetch(url, { credentials: 'same-origin' });

                if (!response.ok) {
                    throw new Error(`Failed to load ${url}`);
                }

                const html = await response.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const selector = trigger.dataset.popupFragment || '.popup, .kt-auth-modal, main';
                const fragment = doc.querySelector(selector);

                if (!fragment) {
                    throw new Error(`Popup fragment not found: ${selector}`);
                }

                content.replaceChildren(fragment.cloneNode(true));
                ui.popupContent(content);
                content.querySelector('.kt-auth-close, .popup__close, button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();
            } catch (error) {
                content.innerHTML = `
                    <div class="kt-popup-loading kt-popup-loading--error" role="alert">
                        <strong>팝업을 불러오지 못했습니다.</strong>
                        <span>${url}</span>
                    </div>
                `;
            }
        };

        document.addEventListener('click', event => {
            const openButton = event.target.closest('[data-popup-open]');

            if (openButton) {
                const popup = getPopup(openButton.dataset.popupOpen);

                if (!popup) {
                    return;
                }

                event.preventDefault();
                openPopup(popup, openButton);

                if (openButton.dataset.popupUrl) {
                    loadRemotePopup(openButton, popup);
                }

                return;
            }

            const closeButton = event.target.closest('[data-popup-close], .popup__close, .kt-auth-close');
            const popup = closeButton?.closest('.popup');

            if (popup) {
                event.preventDefault();
                closePopup(popup);
            }
        });

        document.querySelectorAll('.popup').forEach(popup => {
            popup.addEventListener('mousedown', event => {
                if (event.target === popup && popup.dataset.popupBackdrop !== 'static') {
                    closePopup(popup);
                }
            });
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') {
                return;
            }

            const popup = document.querySelector('.popup.is-active');

            if (popup) {
                closePopup(popup);
            }
        });
    },
    // Auth/User/Components 페이지에서 사용하는 공통 UI 상태
    component: () => {
        // 로그인/회원/비밀번호 찾기 상단 탭과 패널
        document.querySelectorAll('[data-auth-main-tabs]').forEach(tabWrap => {
            const mainTabs = tabWrap.querySelectorAll('[data-auth-main-tab]');
            const mainPanels = tabWrap.querySelectorAll('[data-auth-main-panel]');

            mainTabs.forEach(tab => {
                tab.addEventListener('click', event => {
                    event.preventDefault();

                    const targetName = tab.dataset.authMainTab;

                    mainTabs.forEach(item => {
                        item.classList.toggle('is-active', item === tab);
                    });

                    mainPanels.forEach(panel => {
                        const isTarget = panel.dataset.authMainPanel === targetName;

                        panel.classList.toggle('is-active', isTarget);
                        panel.hidden = !isTarget;
                        panel.setAttribute('aria-hidden', String(!isTarget));
                    });
                });
            });
        });

        // 내 정보 페이지 상단 탭과 패널
        document.querySelectorAll('[data-user-main-tabs]').forEach(tabWrap => {
            const mainTabs = tabWrap.querySelectorAll('[data-user-main-tab]');
            const mainPanels = tabWrap.querySelectorAll('[data-user-main-panel]');

            mainTabs.forEach(tab => {
                tab.addEventListener('click', event => {
                    event.preventDefault();

                    const targetName = tab.dataset.userMainTab;

                    mainTabs.forEach(item => {
                        item.classList.toggle('is-active', item === tab);
                    });

                    mainPanels.forEach(panel => {
                        const isTarget = panel.dataset.userMainPanel === targetName;

                        panel.classList.toggle('is-active', isTarget);
                        panel.hidden = !isTarget;
                        panel.setAttribute('aria-hidden', String(!isTarget));
                    });
                });
            });
        });

        // 패널이 없는 단순 탭 상태
        document.querySelectorAll('.kt-auth-tabs').forEach(tabWrap => {
            tabWrap.querySelectorAll('a[href="#"]').forEach(tab => {
                tab.addEventListener('click', event => {
                    event.preventDefault();

                    tabWrap.querySelectorAll('a').forEach(item => {
                        item.classList.toggle('is-active', item === tab);
                    });
                });
            });
        });

        // 인증 수단 내부 탭과 패널
        document.querySelectorAll('[data-auth-tabs]').forEach(tabWrap => {
            const tabLinks = tabWrap.querySelectorAll('[data-auth-tab]');
            const tabPanels = tabWrap.querySelectorAll('[data-auth-panel]');

            tabLinks.forEach(link => {
                link.addEventListener('click', event => {
                    event.preventDefault();

                    const targetName = link.dataset.authTab;
                    const targetPanel = tabWrap.querySelector(`[data-auth-panel="${targetName}"]`);

                    tabLinks.forEach(item => {
                        item.classList.toggle('is-active', item === link);
                    });

                    if (!targetPanel) {
                        return;
                    }

                    tabPanels.forEach(panel => {
                        const isTarget = panel === targetPanel;

                        panel.hidden = !isTarget;
                        panel.setAttribute('aria-hidden', String(!isTarget));
                    });
                });
            });
        });

        // 인증 방식 카드 선택 상태
        document.querySelectorAll('.kt-auth-methods').forEach(methodWrap => {
            const authContent = methodWrap.closest('.kt-auth-content');
            const methodPanels = authContent ? authContent.querySelectorAll('.kt-auth-panels > li') : [];

            methodWrap.querySelectorAll('.kt-auth-method[href="#"]').forEach(method => {
                method.addEventListener('click', event => {
                    event.preventDefault();

                    methodWrap.querySelectorAll('.kt-auth-method').forEach(item => {
                        item.classList.toggle('is-active', item === method);
                    });

                    if (!methodPanels.length || !method.dataset.authMethod) {
                        return;
                    }

                    methodPanels.forEach(panel => {
                        panel.classList.toggle('is-active', panel.dataset.authPanel === method.dataset.authMethod);
                    });
                });
            });
        });

        // 체크박스형 드롭다운 선택 라벨
        document.querySelectorAll('.kt-dropdown--check').forEach(drop => {
            const trigger = drop.querySelector('[data-dropdown_trg]');
            const items = drop.querySelectorAll('input[type="checkbox"]');
            const defaultText = trigger.dataset.placeholder || trigger.textContent.trim();

            const syncLabel = () => {
                const selected = Array.from(items)
                    .filter(item => item.checked)
                    .map(item => {
                        const label = item.closest('label');
                        const labelText = label.querySelector('span');

                        return (labelText ? labelText.textContent : label.textContent).trim();
                    })
                    .filter(Boolean);

                trigger.textContent = selected.length ? selected.join(', ') : defaultText;
            };

            items.forEach(item => {
                item.addEventListener('change', syncLabel);
            });
            syncLabel();
        });

        // 비밀번호 보기/숨기기 토글
        document.querySelectorAll('[data-password_toggle]').forEach(button => {
            const inputId = button.getAttribute('aria-controls');
            const input = (inputId && document.getElementById(inputId)) || button.closest('.kt-password')?.querySelector('input');
            const icon = button.querySelector('img');
            const showIcon = button.dataset.iconShow;
            const hideIcon = button.dataset.iconHide;

            if (!input) {
                return;
            }

            const syncToggleState = () => {
                const isVisible = input.type === 'text';

                button.setAttribute('aria-pressed', String(isVisible));
                button.setAttribute('aria-label', isVisible ? '비밀번호 숨기기' : '비밀번호 보기');

                if (icon && showIcon && hideIcon) {
                    icon.src = isVisible ? showIcon : hideIcon;
                }
            };

            syncToggleState();

            button.addEventListener('click', () => {
                input.type = input.type === 'password' ? 'text' : 'password';
                syncToggleState();
            });
        });

        // input clear 버튼 클릭 동작
        document.querySelectorAll('[data-clear_input]').forEach(button => {
            const inputId = button.getAttribute('aria-controls');
            const input = inputId && document.getElementById(inputId);

            if (!input) {
                return;
            }

            button.addEventListener('click', () => {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
            });
        });

        // 일반 input/인증번호 input의 clear 버튼 노출 상태
        document.querySelectorAll('.kt-input-field, .kt-password, .kt-search, .kt-user-verify__box, .kt-auth-verify').forEach(field => {
            const input = field.querySelector('input');
            const clearButton = field.querySelector('[data-clear_input]');

            if (!input || !clearButton) {
                return;
            }

            const syncClearButton = () => {
                const hasValue = input.value.trim().length > 0;
                const shouldShow = hasValue;

                field.classList.toggle('has-value', shouldShow);
                clearButton.hidden = !shouldShow;
                clearButton.setAttribute('aria-hidden', String(!shouldShow));
                clearButton.tabIndex = shouldShow ? 0 : -1;
            };

            const markInputStarted = () => {
                syncClearButton();
            };

            input.addEventListener('input', markInputStarted);
            input.addEventListener('change', markInputStarted);
            input.addEventListener('compositionend', markInputStarted);
            input.addEventListener('keyup', markInputStarted);
            syncClearButton();
        });

        // 검색 input의 clear 버튼 노출 상태
        document.querySelectorAll('[data-search_field]').forEach(field => {
            const input = field.querySelector('input');
            const clearButton = field.querySelector('[data-clear_input]');

            if (!input) {
                return;
            }

            const syncClearButton = () => {
                const hasValue = input.value.trim().length > 0;
                const shouldShow = hasValue;

                field.classList.toggle('has-value', shouldShow);

                if (clearButton) {
                    clearButton.hidden = !shouldShow;
                    clearButton.setAttribute('aria-hidden', String(!shouldShow));
                    clearButton.tabIndex = shouldShow ? 0 : -1;
                }
            };

            const markInputStarted = () => {
                syncClearButton();
            };

            input.addEventListener('input', markInputStarted);
            input.addEventListener('change', markInputStarted);
            input.addEventListener('compositionend', markInputStarted);
            input.addEventListener('keyup', markInputStarted);
            syncClearButton();
        });

        // 검색 프롬프트/자동완성 메뉴
        const closePrompt = prompt => {
            prompt.classList.remove('is-open');
            prompt.querySelectorAll('[data-prompt_trg]').forEach(trigger => {
                trigger.setAttribute('aria-expanded', 'false');
            });
        };

        const closeOtherPrompts = current => {
            document.querySelectorAll('[data-prompt].is-open').forEach(prompt => {
                if (prompt !== current) {
                    closePrompt(prompt);
                }
            });
        };

        // 개발 전달: works API 검색(OIF_숫자)은 이 data-prompt 공통 로직을 사용합니다.
        // 대상: #workspaceApiKeyword / 후보 목록: #workspaceApiPromptMenu.
        document.querySelectorAll('[data-prompt]').forEach(prompt => {
            const triggers = prompt.querySelectorAll('[data-prompt_trg]');
            const menu = prompt.querySelector('[data-prompt_menu]');
            const input = prompt.querySelector('input[data-prompt_trg]');
            const options = menu ? menu.querySelectorAll('[role="option"]') : [];
            const foot = menu ? menu.querySelector('[data-prompt_foot]') : null;
            const clearButton = input ? prompt.querySelector(`[data-clear_input][aria-controls="${input.id}"]`) : null;
            const visibleCount = Number(prompt.dataset.promptVisibleCount || menu?.dataset.promptVisibleCount || 0);
            const minLength = Number(prompt.dataset.promptMinLength || menu?.dataset.promptMinLength || 0);

            if (!menu || !triggers.length) {
                return;
            }

            const getKeyword = () => (input ? input.value.trim() : '');
            const hasKeyword = () => getKeyword().length > 0;
            const canSearch = () => !input || minLength <= 0 || getKeyword().length >= minLength;
            const shouldShowAllOptions = () => input && prompt.hasAttribute('data-prompt-show-all') && !hasKeyword();
            const isOptionDisabled = option => option.hasAttribute('data-prompt-disabled') || option.getAttribute('aria-disabled') === 'true';
            const getVisibleOptions = () => Array.from(options).filter(option => !option.hidden && !isOptionDisabled(option));
            const getSelectedOption = () => getVisibleOptions().find(option => option.classList.contains('is-selected'));
            const getActiveOption = () => getSelectedOption() || getVisibleOptions()[0];
            const ignoreSyncKeys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'];
            let selectedPromptValue = '';
            let isSelectingOption = false;

            const normalizePromptValue = value => (value || '').trim().toLowerCase();
            const getOptionValue = option => option?.querySelector('strong')?.textContent.trim() || option?.textContent.trim() || '';
            const clearOptionSelection = () => {
                options.forEach(item => {
                    item.classList.remove('is-selected');
                    item.setAttribute('aria-selected', 'false');
                });
            };
            const isPromptValueComplete = () => Boolean(selectedPromptValue && normalizePromptValue(getKeyword()) === normalizePromptValue(selectedPromptValue));

            const highlightOption = option => {
                if (!option || option.hidden) {
                    return;
                }

                options.forEach(item => {
                    item.classList.remove('is-selected');
                    item.setAttribute('aria-selected', 'false');
                });
                option.classList.add('is-selected');
                option.setAttribute('aria-selected', 'true');
            };

            const openPrompt = () => {
                if (input && ((!hasKeyword() && !shouldShowAllOptions()) || (!canSearch() && !shouldShowAllOptions()))) {
                    closePrompt(prompt);
                    return;
                }

                closeOtherPrompts(prompt);
                prompt.classList.add('is-open');
                triggers.forEach(trigger => {
                    trigger.setAttribute('aria-expanded', 'true');
                });
            };

            const syncClearButton = () => {
                if (!clearButton || !input) {
                    return;
                }

                const hasValue = input.value.trim().length > 0;
                const shouldShow = hasValue;

                clearButton.hidden = !shouldShow;
                clearButton.setAttribute('aria-hidden', String(!shouldShow));
                clearButton.tabIndex = shouldShow ? 0 : -1;
            };

            const hideFoot = () => {
                if (!foot) {
                    return;
                }

                foot.hidden = true;
                foot.style.display = 'none';
                foot.setAttribute('aria-hidden', 'true');
            };

            const syncFoot = matchCount => {
                if (!foot) {
                    return;
                }

                const isComplete = Boolean(input && isPromptValueComplete());

                prompt.classList.toggle('is-complete', isComplete);

                if (isComplete) {
                    hideFoot();
                    return;
                }

                const extraCount = visibleCount > 0 ? Math.max(matchCount - visibleCount, 0) : matchCount;
                const shouldShow = visibleCount > 0 ? extraCount > 0 : matchCount >= 3;
                const message = foot.dataset.promptFootText || '검색어를 더 입력해 결과를 줄여보세요';
                const displayCount = foot.dataset.promptFootCount || extraCount;

                if (!shouldShow) {
                    hideFoot();
                    return;
                }

                foot.hidden = false;
                foot.style.removeProperty('display');
                foot.setAttribute('aria-hidden', 'false');

                const count = document.createElement('strong');

                count.textContent = displayCount;
                foot.replaceChildren(`${message} (`, count, '개 더 있음)');
            };

            const filterOptions = () => {
                if (!input) {
                    syncFoot(0);
                    return 0;
                }

                const keyword = input.value.trim().toLowerCase();
                const showAllOptions = shouldShowAllOptions();
                let matchCount = 0;

                if (!showAllOptions && !canSearch()) {
                    options.forEach(option => {
                        option.hidden = true;
                        option.setAttribute('aria-hidden', 'true');
                        option.classList.remove('is-selected');
                        option.setAttribute('aria-selected', 'false');
                        option.tabIndex = -1;
                    });
                    syncFoot(0);
                    return 0;
                }

                options.forEach(option => {
                    if (isOptionDisabled(option)) {
                        option.hidden = true;
                        option.setAttribute('aria-hidden', 'true');
                        option.classList.remove('is-selected');
                        option.setAttribute('aria-selected', 'false');
                        option.tabIndex = -1;
                        return;
                    }

                    const optionText = option.dataset.searchKeywords || option.textContent;
                    const isMatched = showAllOptions || (keyword.length > 0 && optionText.trim().toLowerCase().includes(keyword));

                    if (isMatched) {
                        matchCount += 1;
                    }

                    const isVisible = isMatched && (visibleCount <= 0 || matchCount <= visibleCount);

                    option.hidden = !isVisible;
                    option.setAttribute('aria-hidden', String(!isVisible));
                    option.tabIndex = isVisible ? 0 : -1;
                });

                syncFoot(matchCount);

                options.forEach(option => {
                    if (option.hidden) {
                        option.classList.remove('is-selected');
                        option.setAttribute('aria-selected', 'false');
                    }
                });

                return matchCount;
            };

            const syncPromptByInput = () => {
                if (isSelectingOption) {
                    filterOptions();
                    syncClearButton();
                    hideFoot();
                    closePrompt(prompt);
                    return;
                }

                if (selectedPromptValue && normalizePromptValue(getKeyword()) !== normalizePromptValue(selectedPromptValue)) {
                    selectedPromptValue = '';
                    clearOptionSelection();
                }

                if (!selectedPromptValue) {
                    clearOptionSelection();
                }

                filterOptions();
                syncClearButton();

                if (((hasKeyword() && canSearch()) || shouldShowAllOptions()) && getVisibleOptions().length) {
                    openPrompt();
                } else {
                    closePrompt(prompt);
                }
            };

            const selectOption = option => {
                if (!option || option.hidden) {
                    return;
                }

                const value = getOptionValue(option);

                highlightOption(option);

                if (input && value) {
                    selectedPromptValue = value;
                    isSelectingOption = true;
                    input.value = value;
                    try {
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    } finally {
                        isSelectingOption = false;
                    }
                    filterOptions();
                    syncClearButton();
                    hideFoot();
                }

                closePrompt(prompt);
            };

            if (input) {
                input.addEventListener('input', syncPromptByInput);
                input.addEventListener('compositionend', syncPromptByInput);
                input.addEventListener('keyup', event => {
                    if (!ignoreSyncKeys.includes(event.key)) {
                        syncPromptByInput();
                    }
                });

                filterOptions();
                syncClearButton();
            }

            triggers.forEach(trigger => {
                trigger.addEventListener('click', event => {
                    event.stopPropagation();

                    if (prompt.classList.contains('is-open') && trigger.tagName !== 'INPUT') {
                        closePrompt(prompt);
                    } else {
                        filterOptions();
                        syncClearButton();
                        openPrompt();
                    }
                });

                trigger.addEventListener('focus', () => {
                    filterOptions();
                    syncClearButton();
                    openPrompt();
                });
                trigger.addEventListener('keydown', event => {
                    if (event.key === 'Escape') {
                        closePrompt(prompt);
                    }

                    if (event.key === 'Enter' && trigger === input && getVisibleOptions().length) {
                        event.preventDefault();
                        selectOption(getActiveOption());
                    }

                    if (event.key === 'ArrowDown' && getVisibleOptions().length) {
                        event.preventDefault();
                        openPrompt();
                        const visibleOptions = getVisibleOptions();
                        const selectedOption = getSelectedOption();
                        const currentIndex = selectedOption ? visibleOptions.indexOf(selectedOption) : -1;
                        const nextOption = visibleOptions[Math.min(currentIndex + 1, visibleOptions.length - 1)];

                        highlightOption(nextOption);
                        nextOption.focus();
                    }

                    if (event.key === 'ArrowUp' && getVisibleOptions().length) {
                        event.preventDefault();
                        openPrompt();
                        const visibleOptions = getVisibleOptions();
                        highlightOption(visibleOptions[visibleOptions.length - 1]);
                        visibleOptions[visibleOptions.length - 1].focus();
                    }
                });
            });

            options.forEach(option => {
                option.addEventListener('click', () => {
                    selectOption(option);
                });

                option.addEventListener('keydown', event => {
                    const visibleOptions = getVisibleOptions();
                    const currentIndex = visibleOptions.indexOf(option);

                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectOption(option);
                    }

                    if (event.key === 'ArrowDown' && visibleOptions.length) {
                        event.preventDefault();
                        const nextOption = visibleOptions[Math.min(currentIndex + 1, visibleOptions.length - 1)];
                        highlightOption(nextOption);
                        nextOption.focus();
                    }

                    if (event.key === 'ArrowUp' && visibleOptions.length) {
                        event.preventDefault();
                        const prevOption = visibleOptions[Math.max(currentIndex - 1, 0)];
                        highlightOption(prevOption);
                        prevOption.focus();
                    }

                    if (event.key === 'Escape') {
                        closePrompt(prompt);
                        input?.focus();
                    }
                });
            });
        });

        document.addEventListener('click', event => {
            document.querySelectorAll('[data-prompt].is-open').forEach(prompt => {
                if (!prompt.contains(event.target)) {
                    closePrompt(prompt);
                }
            });
        });
    },
    codeSnippet: () => {
        const snippetWraps = document.querySelectorAll('[data-code-snippet]');

        if (window.hljs) {
            document.querySelectorAll('.kt-tool-code code').forEach(code => {
                window.hljs.highlightElement(code);
            });
        }

        // eslint-disable-next-line no-shadow
        snippetWraps.forEach(wrap => {
            const tabs = wrap.querySelectorAll('[data-snippet-tab]');
            const panels = wrap.querySelectorAll('[data-snippet-panel]');
            const copyButton = wrap.querySelector('[data-snippet-copy]');

            if (!tabs.length || !panels.length) {
                return;
            }

            const activateTab = activeTab => {
                const activeName = activeTab.dataset.snippetTab;

                tabs.forEach(tab => {
                    const isActive = tab === activeTab;

                    tab.classList.toggle('is-active', isActive);
                    tab.setAttribute('aria-selected', String(isActive));
                    tab.tabIndex = isActive ? 0 : -1;
                });

                panels.forEach(panel => {
                    const isActive = panel.dataset.snippetPanel === activeName;

                    panel.classList.toggle('is-active', isActive);
                    panel.hidden = !isActive;
                    panel.setAttribute('aria-hidden', String(!isActive));
                });
            };

            tabs.forEach(tab => {
                tab.addEventListener('click', () => activateTab(tab));
                tab.addEventListener('keydown', event => {
                    const keyMap = {
                        ArrowLeft: -1,
                        ArrowUp: -1,
                        ArrowRight: 1,
                        ArrowDown: 1,
                    };
                    const direction = keyMap[event.key];

                    if (!direction) {
                        return;
                    }

                    event.preventDefault();

                    const tabArray = Array.from(tabs);
                    const currentIndex = tabArray.indexOf(tab);
                    const nextIndex = (currentIndex + direction + tabArray.length) % tabArray.length;
                    const nextTab = tabArray[nextIndex];

                    activateTab(nextTab);
                    nextTab.focus();
                });
            });

            copyButton?.addEventListener('click', async () => {
                const activePanel = wrap.querySelector('[data-snippet-panel].is-active');
                const text = activePanel?.querySelector('code')?.textContent || activePanel?.textContent || '';

                if (!text.trim() || !navigator.clipboard) {
                    return;
                }

                try {
                    await navigator.clipboard.writeText(text.trim());
                    copyButton.classList.add('is-copied');
                    window.setTimeout(() => copyButton.classList.remove('is-copied'), 1400);
                } catch (error) {
                    copyButton.classList.remove('is-copied');
                }
            });
        });
    },
    apiTree: () => {
        const trees = document.querySelectorAll('[data-api-tree]');

        if (!trees.length) {
            return;
        }

        const getDirectList = item => Array.from(item.children).find(child => child.tagName === 'UL');

        const setOpen = (item, isOpen) => {
            if (!item) {
                return;
            }

            const button = Array.from(item.children).find(child => child.tagName === 'BUTTON');
            const list = getDirectList(item);

            if (!list) {
                item.classList.remove('is-open');
                button?.setAttribute('aria-expanded', 'false');
                return;
            }

            item.classList.toggle('is-open', isOpen);
            button?.setAttribute('aria-expanded', String(isOpen));
            list.hidden = !isOpen;
        };

        const getLeafData = leaf => ({
            name: leaf.dataset.apiName || leaf.textContent.trim(),
            code: leaf.dataset.apiCode || '',
            method: leaf.dataset.apiMethod || '',
            path: leaf.dataset.apiPath || '',
            protocol: leaf.dataset.apiProtocol || 'rest',
        });

        const syncDetail = (tree, leaf) => {
            const data = getLeafData(leaf);
            const page = tree.closest('.kt-tool-main') || document;
            const protocolBadge = page.querySelector('.kt-tool-detail__head .kt-badge');

            Object.entries(data).forEach(([key, value]) => {
                page.querySelectorAll(`[data-api-detail="${key}"]`).forEach(target => {
                    target.textContent = key === 'protocol' ? value.toUpperCase() : value;
                });
            });

            if (protocolBadge) {
                protocolBadge.textContent = data.protocol.toUpperCase();
            }

            tree.dispatchEvent(
                new CustomEvent('api-tree-select', {
                    bubbles: true,
                    detail: data,
                }),
            );
        };

        trees.forEach(tree => {
            const sidebar = tree.closest('.kt-tool-sidebar') || document;
            const searchInput = sidebar.querySelector('[data-api-tree-search] input');
            const searchSubmit = sidebar.querySelector('[data-api-tree-search-submit]');
            const tabButtons = sidebar.querySelectorAll('[data-api-tree-tab]');
            const empty = tree.querySelector('.kt-tool-tree__empty');
            let activeProtocol = 'all';
            const branches = tree.querySelectorAll('.kt-tool-tree__branch');

            tree.querySelectorAll('.kt-tool-tree__group').forEach(group => {
                setOpen(group, false);
            });

            branches.forEach(branch => setOpen(branch, false));

            const openActivePath = () => {
                const activeLeaf = tree.querySelector('[data-api-leaf].is-active');

                if (!activeLeaf) {
                    return;
                }

                setOpen(activeLeaf.closest('.kt-tool-tree__group'), true);
                setOpen(activeLeaf.closest('.kt-tool-tree__branch'), true);
            };

            openActivePath();

            const applyFilter = () => {
                const keyword = (searchInput?.value || '').trim().toLowerCase();
                let hasVisibleBranch = false;

                branches.forEach(branch => {
                    const protocol = branch.dataset.protocol || 'rest';
                    const protocolMatched = activeProtocol === 'all' || activeProtocol === protocol;
                    const branchButton = Array.from(branch.children).find(child => child.classList?.contains('kt-tool-tree__branch-btn'));
                    const branchTextMatched = !keyword || branchButton?.textContent.toLowerCase().includes(keyword);
                    let branchMatched = false;

                    if (!protocolMatched) {
                        branch.querySelectorAll('[data-api-leaf]').forEach(leaf => {
                            const item = leaf.closest('li');
                            if (item) {
                                item.hidden = true;
                            }
                        });
                    }

                    branch.querySelectorAll('.kt-tool-tree__children > li').forEach(group => {
                        const groupButton = Array.from(group.children).find(child => child.classList?.contains('kt-tool-tree__group-btn'));

                        if (!groupButton) {
                            return;
                        }

                        const groupTextMatched = !keyword || groupButton.textContent.toLowerCase().includes(keyword);
                        let groupMatched = false;

                        group.querySelectorAll('[data-api-leaf]').forEach(leaf => {
                            const item = leaf.closest('li');
                            const terms = [leaf.textContent, leaf.dataset.apiName, leaf.dataset.apiCode, leaf.dataset.apiMethod, leaf.dataset.apiPath, leaf.dataset.apiProtocol]
                                .filter(Boolean)
                                .join(' ')
                                .toLowerCase();
                            const leafMatched = !keyword || branchTextMatched || groupTextMatched || terms.includes(keyword);

                            if (item) {
                                item.hidden = !protocolMatched || !leafMatched;
                            }

                            groupMatched = groupMatched || leafMatched;
                        });

                        group.hidden = !protocolMatched || !groupMatched;
                        branchMatched = branchMatched || groupMatched;

                        if (keyword && protocolMatched && groupMatched) {
                            setOpen(group, true);
                        }
                    });

                    const visibleLeaf = Array.from(branch.querySelectorAll('[data-api-leaf]')).some(leaf => !leaf.closest('li')?.hidden);
                    const visibleGroup = Array.from(branch.querySelectorAll('.kt-tool-tree__children > li')).some(item => !item.hidden);
                    const branchVisible = protocolMatched && (branchTextMatched || branchMatched || visibleLeaf || visibleGroup);

                    branch.hidden = !branchVisible;

                    if (branchVisible) {
                        hasVisibleBranch = true;
                    }

                    if (keyword && branchVisible) {
                        setOpen(branch, true);
                    }
                });

                if (empty) {
                    empty.hidden = hasVisibleBranch;
                }
            };

            tree.addEventListener('click', event => {
                const branchButton = event.target.closest('.kt-tool-tree__branch-btn');
                const groupButton = event.target.closest('.kt-tool-tree__group-btn');
                const leaf = event.target.closest('[data-api-leaf]');

                if (branchButton && tree.contains(branchButton)) {
                    const branch = branchButton.closest('.kt-tool-tree__branch');

                    setOpen(branch, !branch?.classList.contains('is-open'));
                    return;
                }

                if (groupButton && tree.contains(groupButton)) {
                    const group = groupButton.closest('li');

                    setOpen(group, !group?.classList.contains('is-open'));
                    return;
                }

                if (leaf && tree.contains(leaf)) {
                    tree.querySelectorAll('[data-api-leaf].is-active').forEach(item => {
                        item.classList.remove('is-active');
                    });
                    leaf.classList.add('is-active');
                    syncDetail(tree, leaf);
                }
            });

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    activeProtocol = button.dataset.apiTreeTab || 'all';

                    tabButtons.forEach(tab => {
                        const isActive = tab === button;

                        tab.classList.toggle('is-active', isActive);
                        tab.setAttribute('aria-selected', String(isActive));
                    });

                    applyFilter();
                });
            });

            searchInput?.addEventListener('input', applyFilter);
            searchSubmit?.addEventListener('click', () => {
                searchInput?.focus();
                applyFilter();
            });
            applyFilter();
        });
    },
    // New Work 페이지 검색, 선택, 삭제 인터랙션
    newwork: () => {
        const searches = document.querySelectorAll('[data-newwork-search]');
        const inputFields = document.querySelectorAll('[data-newwork-input]');

        // 일반 입력 필드 clear 버튼
        const syncInputClear = field => {
            const input = field.querySelector('input');
            const clear = field.querySelector('[data-newwork-input-clear]');
            const hasValue = Boolean(input?.value.trim());

            if (!clear) {
                return;
            }

            clear.hidden = !hasValue;
            clear.setAttribute('aria-hidden', String(!hasValue));
            clear.setAttribute('tabindex', hasValue ? '0' : '-1');
        };

        inputFields.forEach(field => {
            const input = field.querySelector('input');
            const clear = field.querySelector('[data-newwork-input-clear]');

            if (!input || !clear) {
                return;
            }

            input.addEventListener('input', () => syncInputClear(field));
            clear.addEventListener('click', event => {
                event.preventDefault();
                input.value = '';
                syncInputClear(field);
                input.focus();
            });

            syncInputClear(field);
        });

        // 검색 메뉴 열림 상태
        const closeSearch = search => {
            search.classList.remove('is-open');
            search.querySelectorAll('[data-newwork-option].is-active').forEach(option => option.classList.remove('is-active'));
        };

        // 검색 필드 clear 버튼
        const syncClear = search => {
            const input = search.querySelector('input');
            const clear = search.querySelector('[data-newwork-clear]');
            const hasValue = Boolean(input?.value.trim());

            if (!clear) {
                return;
            }

            clear.hidden = !hasValue;
            clear.setAttribute('aria-hidden', String(!hasValue));
            clear.setAttribute('tabindex', hasValue ? '0' : '-1');
        };

        const getOptionData = option => {
            const label = option.dataset.label || option.querySelector('strong')?.textContent.trim() || '';
            const meta = option.dataset.meta || option.querySelector('span:last-child')?.textContent.trim() || '';

            return { label, meta };
        };

        // 선택한 멤버 행 생성
        const createMemberRow = (label, meta) => {
            const item = document.createElement('li');
            const text = document.createElement('div');
            const name = document.createElement('strong');
            const divider = document.createElement('span');
            const email = document.createElement('em');
            const remove = document.createElement('button');
            const blind = document.createElement('span');

            item.className = 'kt-newwork-member-row kt-newwork-member-row--selected';
            item.dataset.memberValue = meta || label;
            name.textContent = label;
            divider.setAttribute('aria-hidden', 'true');
            email.textContent = meta;
            remove.type = 'button';
            remove.className = 'kt-newwork-remove';
            remove.dataset.newworkMemberRemove = '';
            blind.className = 'blind';
            blind.textContent = '삭제';
            text.append(name, divider, email);
            remove.append(blind);
            item.append(text, remove);

            return item;
        };

        // 멤버 검색 필수값 오류 상태
        const syncMemberError = search => {
            const selectedList = search.closest('.kt-newwork-member-group')?.querySelector('[data-newwork-selected-members]');
            const input = search.querySelector('input');
            const error = search.querySelector('.kt-newwork-search__error');

            if (!error) {
                search.classList.remove('is-error');
                input?.removeAttribute('aria-invalid');
                return;
            }

            const hasMember = Boolean(selectedList?.children.length);
            const hasKeyword = Boolean(input?.value.trim());
            const shouldShowError = search.dataset.newworkSearchType === 'member' && !hasMember && !hasKeyword;

            search.classList.toggle('is-error', shouldShowError);
            input?.setAttribute('aria-invalid', String(shouldShowError));
        };

        const addSelectedMember = (search, option) => {
            const selectedList = search.closest('.kt-newwork-member-group')?.querySelector('[data-newwork-selected-members]');
            const { label, meta } = getOptionData(option);
            const value = meta || label;

            if (!selectedList || !label) {
                return;
            }

            const hasSameMember = Array.from(selectedList.children).some(item => item.dataset.memberValue === value);

            if (!hasSameMember) {
                selectedList.appendChild(createMemberRow(label, meta));
            }

            syncMemberError(search);
        };

        // 서비스 선택 결과 영역 동기화
        const updateSelectedService = (search, option) => {
            const selectedService = search.closest('.kt-newwork-form')?.querySelector('[data-newwork-selected-service]');

            if (!selectedService) {
                return;
            }

            ['service', 'code', 'po', 'email'].forEach(key => {
                const target = selectedService.querySelector(`[data-service-value="${key}"]`);
                const value = option.dataset[key];

                if (target && value) {
                    target.textContent = value;
                }
            });
        };

        // 검색어 기준 옵션 필터링
        const filterOptions = search => {
            const input = search.querySelector('input');
            const menu = search.querySelector('[data-newwork-menu]');
            const count = search.querySelector('[data-newwork-count]');
            const options = menu ? Array.from(menu.querySelectorAll('[data-newwork-option]')) : [];
            const minLength = Number(search.dataset.minLength || 1);
            const keyword = input?.value.trim().toLowerCase() || '';

            if (keyword.length < minLength) {
                options.forEach(option => {
                    option.closest('li').hidden = true;
                    option.classList.remove('is-active');
                });
                if (count) count.textContent = '0';
                return [];
            }

            const visibleOptions = options.filter(option => {
                const searchText = (option.dataset.search || option.textContent || '').toLowerCase();
                const isVisible = searchText.includes(keyword);

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

        // 키보드/마우스 이동 시 활성 옵션 표시
        const highlightOption = (search, nextOption) => {
            if (!nextOption) {
                return;
            }

            search.querySelectorAll('[data-newwork-option].is-active').forEach(option => option.classList.remove('is-active'));
            nextOption.classList.add('is-active');
            nextOption.scrollIntoView({ block: 'nearest' });
        };

        // 선택한 옵션을 멤버/서비스 상태에 반영
        const selectOption = (search, option) => {
            const input = search.querySelector('input');
            const menu = search.querySelector('[data-newwork-menu]');
            const options = menu ? menu.querySelectorAll('[data-newwork-option]') : [];
            const currentCheck = menu?.querySelector('.kt-newwork-check');
            const { label } = getOptionData(option);
            const searchType = search.dataset.newworkSearchType;

            options.forEach(item => item.classList.remove('is-selected'));
            option.classList.add('is-selected');

            if (currentCheck && currentCheck.parentElement !== option) {
                option.appendChild(currentCheck);
            }

            if (searchType === 'member') {
                addSelectedMember(search, option);
                input.value = '';
            } else {
                input.value = label;
                updateSelectedService(search, option);
            }

            closeSearch(search);
            syncClear(search);
        };

        if (!searches.length) {
            return;
        }

        searches.forEach(search => {
            const input = search.querySelector('input');
            const clear = search.querySelector('[data-newwork-clear]');
            const menu = search.querySelector('[data-newwork-menu]');
            const options = menu ? Array.from(menu.querySelectorAll('[data-newwork-option]')) : [];

            if (!input || !menu) {
                return;
            }

            const openSearch = () => {
                const visibleOptions = filterOptions(search);

                if (visibleOptions.length) {
                    search.classList.add('is-open');
                } else {
                    closeSearch(search);
                }
                syncClear(search);
                syncMemberError(search);
            };

            input.addEventListener('focus', openSearch);
            input.addEventListener('input', () => {
                if (input.value.trim()) {
                    openSearch();
                } else {
                    closeSearch(search);
                }
                syncClear(search);
                syncMemberError(search);
            });
            input.addEventListener('keydown', event => {
                const visibleOptions = filterOptions(search);
                const currentIndex = visibleOptions.findIndex(option => option.classList.contains('is-active'));

                if (event.key === 'ArrowDown' && visibleOptions.length) {
                    event.preventDefault();
                    search.classList.add('is-open');
                    highlightOption(search, visibleOptions[Math.min(currentIndex + 1, visibleOptions.length - 1)]);
                }

                if (event.key === 'ArrowUp' && visibleOptions.length) {
                    event.preventDefault();
                    search.classList.add('is-open');
                    highlightOption(search, visibleOptions[Math.max(currentIndex - 1, 0)]);
                }

                if (event.key === 'Enter' && visibleOptions.length) {
                    event.preventDefault();
                    selectOption(search, visibleOptions[Math.max(currentIndex, 0)]);
                }

                if (event.key === 'Escape') {
                    closeSearch(search);
                }
            });

            clear?.addEventListener('click', event => {
                event.preventDefault();
                input.value = '';
                closeSearch(search);
                syncClear(search);
                syncMemberError(search);
                input.focus();
            });

            options.forEach(option => {
                option.addEventListener('mouseenter', () => highlightOption(search, option));
                option.addEventListener('click', () => selectOption(search, option));
                option.addEventListener('keydown', event => {
                    const visibleOptions = filterOptions(search);
                    const currentIndex = visibleOptions.indexOf(option);

                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectOption(search, option);
                    }

                    if (event.key === 'ArrowDown' && visibleOptions.length) {
                        event.preventDefault();
                        const nextOption = visibleOptions[Math.min(currentIndex + 1, visibleOptions.length - 1)];
                        highlightOption(search, nextOption);
                        nextOption.focus();
                    }

                    if (event.key === 'ArrowUp' && visibleOptions.length) {
                        event.preventDefault();
                        const prevOption = visibleOptions[Math.max(currentIndex - 1, 0)];
                        highlightOption(search, prevOption);
                        prevOption.focus();
                    }

                    if (event.key === 'Escape') {
                        closeSearch(search);
                        input.focus();
                    }
                });
            });

            syncClear(search);
            syncMemberError(search);
        });

        document.addEventListener('click', event => {
            searches.forEach(search => {
                if (!search.contains(event.target)) {
                    closeSearch(search);
                }
            });
        });

        document.addEventListener('click', event => {
            const removeButton = event.target.closest('[data-newwork-member-remove]');

            if (!removeButton) {
                return;
            }

            const group = removeButton.closest('.kt-newwork-member-group');
            const row = removeButton.closest('.kt-newwork-member-row');

            row?.remove();

            const search = group?.querySelector('[data-newwork-search]');

            if (search) {
                syncMemberError(search);
            }
        });
    },
    init: () => {
        wrap = document.getElementById('wrap');
        syncHeight();

        // PC GNB hover/focus 상태
        (() => {
            const header = document.getElementById('header');
            const gnbWrap = document.querySelector('.gnb > ul');
            const depth2List = document.querySelectorAll('.gnb .depth2');

            const headerOpen = () => {
                header.classList.add('__hover');

                depth2List.forEach(depth2 => {
                    depth2.classList.add('__show');
                });
            };

            const headerClose = () => {
                header.classList.remove('__hover');

                depth2List.forEach(depth2 => {
                    depth2.classList.remove('__show');
                });
            };

            if (gnbWrap) {
                gnbWrap.addEventListener('mouseenter', headerOpen);
                header.addEventListener('mouseleave', headerClose);

                gnbWrap.querySelectorAll('a').forEach(a => {
                    a.addEventListener('focus', headerOpen);
                });
            }
        })();

        // 내부 앵커 부드러운 이동
        (() => {
            document.querySelectorAll('a[href^="#"]').forEach(anc => {
                anc.addEventListener('click', function (e) {
                    if (this.getAttribute('href') === '#') {
                        e.preventDefault();
                        return;
                    }

                    e.preventDefault();

                    const target = document.querySelector(this.getAttribute('href'));

                    if (!target) {
                        return;
                    }

                    target.scrollIntoView({
                        behavior: 'smooth',
                    });
                });
            });
        })();
    },
};

document.addEventListener('DOMContentLoaded', () => {
    ui.dropdown();
    ui.accordion();
    ui.supportTabs();
    ui.textareaCounter();
    ui.supportInquiry();
    ui.pagination();
    ui.popup();
    ui.component();
    ui.codeSnippet();
    ui.apiTree();
    ui.newwork();
    ui.init();
});

window.addEventListener('resize', () => {
    syncHeight();
});

window.addEventListener('scroll', () => {
    scrollHeader();
    scrollTopBtn();
});
