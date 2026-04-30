let scrollY;
let wrap;
let winHeight;
let docHeight;
let scrollP;

// 스크린 높이 계산
function syncHeight() {
    document.documentElement.style.setProperty('--window-inner-height', `${window.innerHeight}px`);
}

// mobile check
function isMobile() {
    const width = window.innerWidth;
    if (width < 1025) {
        return true;
    }
    return false;
}

// body scroll lock
function bodyLock() {
    scrollY = window.scrollY;
    document.documentElement.classList.add('is-locked');
    wrap.style.top = `-${scrollY}px`;
    // AOS 사용시 refresh 필요
    // AOS.refresh();
}

// body scroll unlock
function bodyUnlock() {
    document.documentElement.classList.remove('is-locked');
    window.scrollTo(0, scrollY);
    wrap.style.top = '';
    // AOS 사용시 refresh 필요
    // AOS.refresh();
}

// popup open
function popOpen(id) {
    $('#' + id).fadeIn('fast');
    $('#' + id)
        .find('button:eq(0)')
        .focus();
    bodyLock();
}

// popup close
function popClose(obj) {
    $(obj).parents('.popup').fadeOut('fast');
    bodyUnlock();
}

// scroll header
function scrollHeader() {
    scrollP = $(window).scrollTop();
    if (scrollP > 50) {
        $('#header').addClass('__scrolled');
    } else {
        $('#header').removeClass('__scrolled');
    }
}

// top Button
function scrollTopBtn() {
    scrollP = $(window).scrollTop();
    if (scrollP > 50) {
        $('.top-btn-wrap').fadeIn('fast');
        // if (isMobile()) {
        // } else {
        // }
    } else {
        $('.top-btn-wrap').fadeOut('fast');
        // if (isMobile()) {
        // }
    }
    if ($('#footer').length) {
        if ($(window).scrollTop() + $(window).innerHeight() > $('#footer').offset().top) {
            $('.top-btn-wrap').addClass('__abs');
        } else {
            $('.top-btn-wrap').removeClass('__abs');
        }
    }
}

// 파일 첨부
function addFile(obj) {
    const filesArr = [];
    const uploadBox = obj.parentElement;
    const infoText = uploadBox.querySelector('.desc-text');
    const btn = uploadBox.querySelector('.btn-upload');
    const input = uploadBox.querySelector('input[type=file]');

    if (infoText) {
        infoText.classList.add('__hide');
    }

    for (let i = 0; i < obj.files.length; i++) {
        // 파일 배열에 담기
        const reader = new FileReader();
        reader.onload = function () {
            filesArr.push(obj.files[i]);
        };
        reader.readAsDataURL(obj.files[i]);
        const fileNo = new Date().getTime();

        // 목록 추가
        const htmlDataParent = obj.parentElement;
        let htmlData = htmlDataParent.querySelector('.upload-list').innerHTML;

        if (htmlDataParent.querySelector('.upload-list').classList.contains('download')) {
            htmlData += '<li id="file' + fileNo + '" class="file-item">';
            htmlData += '   <p class="name"><a href="" download>' + obj.files[i].name + '</a></p>';
            htmlData +=
                '   <a class="delete-btn" onclick="deleteFile(' + fileNo + ');"><span class="blind">삭제</span></a>';
            htmlData += '</li>';
        } else {
            htmlData += '<li id="file' + fileNo + '" class="file-item">';
            htmlData += '   <p class="name">' + obj.files[i].name + '</p>';
            htmlData +=
                '   <a class="delete-btn" onclick="deleteFile(' + fileNo + ');"><span class="blind">삭제</span></a>';
            htmlData += '</li>';
        }

        htmlDataParent.querySelector('.upload-list').innerHTML = htmlData;
    }
    if (!$('input[type="file"][multiple]').length) {
        input.setAttribute('disabled', '');
    }

    document.querySelector('input[type=file]').value = '';
}

// 첨부 파일 삭제
function deleteFile(num) {
    const uploadBox = document.querySelector(`#file${num}`).closest('.upload-img');
    const li = document.querySelector(`#file${num}`);
    const btn = uploadBox.querySelector('.btn-upload');
    const input = uploadBox.querySelector('input[type=file]');
    const infoText = uploadBox.querySelector('.desc-text');

    // 파일 없을 경우 infoText 노출
    if (infoText) {
        infoText.classList.remove('__hide');
    }

    // 버튼 활성화
    if (input) {
        input.removeAttribute('disabled');
    }
    document.querySelector('#file' + num).remove();
}

// footer selectbox value값 없는 option에 대해서는 반응X about:blank#blocked
function footerSelectbox(value) {
    if (value !== '') {
        window.open(value, '_blank');
    }
}

const ui = {
    dropdown: () => {
        const dropWrap = document.querySelectorAll('[data-dropdown_wrap]');

        dropWrap.forEach(e => {
            const dropTrg = e.querySelector('[data-dropdown_trg]');
            const dropMenu = e.querySelector('[data-dropdown_menu]');

            if (!dropTrg || !dropMenu) {
                return;
            }

            const dropItem = dropMenu.querySelectorAll('a, button');
            const trgPosY = dropTrg.getBoundingClientRect().top;
            const winY = window.innerHeight / 4;
            const CalwinY = winY * 3;

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

                // if (trgPosY <= CalwinY) {
                //     // 윈도우 중앙 기준 상단 위치
                //     dropTrg.classList.add('__down');
                //     dropMenu.style.top = `${dropTrg.clientHeight}px`;
                // } else {
                //     // 윈도우 중앙 기준 하단 위치
                //     dropTrg.classList.add('__up');
                //     dropMenu.style.bottom = `${dropTrg.clientHeight}px`;
                // }
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
                    $('[data-dropdown_wrap] [data-dropdown_trg][aria-expanded="true"]')
                        .attr('aria-selected', 'false')
                        .attr('aria-expanded', 'false');
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
            // 외부 요소 클릭 시 닫힘
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
    accordion: () => {
        $('[data-accordion]').each(function () {
            const others = $(this).find('[data-accordion_cont][aria-hidden]');
            const btn = $(this).find('[data-accordion_trg] > button[aria-controls]');
            btn.on('click', function () {
                const expanded = $(this).attr('aria-expanded');
                const cont = $(this).attr('aria-controls');
                if (expanded === 'true') {
                    $('#' + cont).slideUp('fast');
                    $(this).attr('aria-expanded', 'false');
                    $('#' + cont).attr('aria-hidden', 'true');
                } else {
                    others.attr('aria-hidden', 'true').slideUp('fast');
                    $('#' + cont).slideDown('fast');
                    btn.attr('aria-expanded', 'false');
                    $(this).attr('aria-expanded', 'true');
                    $('#' + cont).attr('aria-hidden', 'false');
                }
            });
        });
    },
    pagination: () => {
        $('[data-pagination] ul > li > a').on('click', function () {
            $('[data-pagination] ul > li > a').removeAttr('aria-current');
            $(this).attr('aria-current', 'true');
        });
    },
    tab: () => {
        $('[data-tab_wrap]').each(function () {
            const tabWrap = $(this);
            const panels = tabWrap.find('[role="tabpanel"]');
            const btn = tabWrap.find('[data-tab_btn]>button');
            const tabDropBtn = tabWrap.find('.tab-drop-btn');
            const selectText = tabWrap.find('[aria-selected="true"]').text();
            tabDropBtn.text(selectText);

            btn.on('click', el => {
                btn.attr('aria-selected', 'false');
                btn.removeAttr('aria-current');
                $(el.target).closest('nav').prev().text(el.target.innerText);
                $(el.target).attr('aria-selected', 'true');
                $(el.target).attr('aria-current', 'true');
                if (panels) {
                    const controlTg = el.target.getAttribute('aria-controls');
                    panels.attr('hidden', 'true');
                    $('#' + controlTg).removeAttr('hidden');
                }
            });
            if (isMobile) {
                tabDropBtn.on('click', () => {
                    if (tabDropBtn.hasClass('__show')) {
                        tabDropBtn.removeClass('__show');
                    } else {
                        tabDropBtn.addClass('__show');
                    }
                });
                btn.on('click', () => {
                    tabDropBtn.removeClass('__show');
                });
            }

            // 20240326 아코디언 연동 스크립트 추가
            if ($(this).hasClass('__connect')) {
                const accordion = $('[data-accordion]');
                const items = accordion.find('[data-sort]');
                btn.on('click', el => {
                    const btnCtrl = $(el.target).attr('aria-controls');
                    if (btnCtrl === 'all') {
                        items.show();
                    } else {
                        items.hide();
                        $(`[data-sort="${btnCtrl}"]`).show();
                    }
                    console.log(btnCtrl);
                });
            }
        });
    },
    component: () => {
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

        document.querySelectorAll('[data-password_toggle]').forEach(button => {
            const inputId = button.getAttribute('aria-controls');
            const input =
                (inputId && document.getElementById(inputId)) || button.closest('.kt-password')?.querySelector('input');
            const icon = button.querySelector('img');
            const showIcon = button.dataset.iconShow;
            const hideIcon = button.dataset.iconHide;

            if (!input) {
                return;
            }

            button.addEventListener('click', () => {
                const willShow = input.type === 'password';

                input.type = willShow ? 'text' : 'password';
                button.setAttribute('aria-pressed', String(willShow));
                button.setAttribute('aria-label', willShow ? '비밀번호 숨기기' : '비밀번호 보기');

                if (icon && showIcon && hideIcon) {
                    icon.src = willShow ? hideIcon : showIcon;
                }
            });
        });

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

        document.querySelectorAll('.kt-input-field, .kt-password, .kt-search').forEach(field => {
            const input = field.querySelector('input');
            const clearButton = field.querySelector('[data-clear_input]');

            if (!input || !clearButton) {
                return;
            }

            let hasInputStarted = false;

            const syncClearButton = () => {
                const hasValue = input.value.trim().length > 0;
                const shouldShow = hasInputStarted && hasValue;

                field.classList.toggle('has-value', shouldShow);
                clearButton.hidden = !shouldShow;
                clearButton.setAttribute('aria-hidden', String(!shouldShow));
                clearButton.tabIndex = shouldShow ? 0 : -1;
            };

            const markInputStarted = () => {
                hasInputStarted = true;
                syncClearButton();
            };

            input.addEventListener('input', markInputStarted);
            input.addEventListener('change', markInputStarted);
            input.addEventListener('compositionend', markInputStarted);
            input.addEventListener('keyup', markInputStarted);
            syncClearButton();
        });

        document.querySelectorAll('[data-search_field]').forEach(field => {
            const input = field.querySelector('input');
            const clearButton = field.querySelector('[data-clear_input]');

            if (!input) {
                return;
            }

            let hasInputStarted = false;

            const syncClearButton = () => {
                const hasValue = input.value.trim().length > 0;
                const shouldShow = hasInputStarted && hasValue;

                field.classList.toggle('has-value', shouldShow);

                if (clearButton) {
                    clearButton.hidden = !shouldShow;
                    clearButton.setAttribute('aria-hidden', String(!shouldShow));
                    clearButton.tabIndex = shouldShow ? 0 : -1;
                }
            };

            const markInputStarted = () => {
                hasInputStarted = true;
                syncClearButton();
            };

            input.addEventListener('input', markInputStarted);
            input.addEventListener('change', markInputStarted);
            input.addEventListener('compositionend', markInputStarted);
            input.addEventListener('keyup', markInputStarted);
            syncClearButton();
        });

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

        document.querySelectorAll('[data-prompt]').forEach(prompt => {
            const triggers = prompt.querySelectorAll('[data-prompt_trg]');
            const menu = prompt.querySelector('[data-prompt_menu]');
            const input = prompt.querySelector('input[data-prompt_trg]');
            const options = menu ? menu.querySelectorAll('[role="option"]') : [];
            const foot = menu ? menu.querySelector('[data-prompt_foot]') : null;
            const clearButton = input
                ? prompt.querySelector(`[data-clear_input][aria-controls="${input.id}"]`)
                : null;
            let hasInputStarted = false;

            if (!menu || !triggers.length) {
                return;
            }

            const hasKeyword = () => input && input.value.trim().length > 0;
            const getVisibleOptions = () => Array.from(options).filter(option => !option.hidden);
            const getSelectedOption = () =>
                getVisibleOptions().find(option => option.classList.contains('is-selected'));
            const getActiveOption = () => getSelectedOption() || getVisibleOptions()[0];
            const ignoreSyncKeys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'];

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
                if (input && !hasKeyword()) {
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
                const shouldShow = hasInputStarted && hasValue;

                clearButton.hidden = !shouldShow;
                clearButton.setAttribute('aria-hidden', String(!shouldShow));
                clearButton.tabIndex = shouldShow ? 0 : -1;
            };

            const syncFoot = matchCount => {
                if (!foot) {
                    return;
                }

                const shouldShow = matchCount >= 3;
                const message = foot.dataset.promptFootText || '검색어를 더 입력해 결과를 줄여보세요';

                foot.hidden = !shouldShow;
                foot.setAttribute('aria-hidden', String(!shouldShow));

                if (shouldShow) {
                    foot.textContent = `${message} (${matchCount}개 더 있음)`;
                }
            };

            const filterOptions = () => {
                if (!input) {
                    syncFoot(0);
                    return 0;
                }

                const keyword = input.value.trim().toLowerCase();
                let matchCount = 0;

                options.forEach(option => {
                    const isMatched = keyword.length > 0 && option.textContent.trim().toLowerCase().includes(keyword);

                    if (isMatched) {
                        matchCount += 1;
                    }

                    option.hidden = !isMatched;
                    option.setAttribute('aria-hidden', String(!isMatched));
                    option.tabIndex = isMatched ? 0 : -1;
                });

                syncFoot(matchCount);

                options.forEach(option => {
                    if (option.hidden) {
                        option.classList.remove('is-selected');
                        option.setAttribute('aria-selected', 'false');
                    }
                });

                const visibleOptions = getVisibleOptions();

                if (keyword.length && visibleOptions.length && !getSelectedOption()) {
                    highlightOption(visibleOptions[0]);
                }

                return matchCount;
            };

            const syncPromptByInput = () => {
                hasInputStarted = true;
                filterOptions();
                syncClearButton();

                if (hasKeyword() && getVisibleOptions().length) {
                    openPrompt();
                } else {
                    closePrompt(prompt);
                }
            };

            const selectOption = option => {
                if (!option || option.hidden) {
                    return;
                }

                const value = option.querySelector('strong')?.textContent.trim() || option.textContent.trim();

                highlightOption(option);

                if (input && value) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
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
                        getActiveOption().focus();
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
    // modal 팝업 동작 및 접근성
    modal: e => {
        // e.preventDefault();
        const op = $(e);
        const lp = $('#' + op.attr('aria-controls'));
        const lpObj = lp.children('.popup__inner');
        const lpObjClose = lp.find('.popup__close');
        const lpObjTabbable = lpObj.find(
            "button, input:not([type='hidden']), select, iframe, textarea, [href], [tabindex]:not([tabindex='-1'])",
        );
        const lpObjTabbableFirst = lpObjTabbable && lpObjTabbable.first();
        const lpObjTabbableLast = lpObjTabbable && lpObjTabbable.last();
        const lpOuterObjHidden = $('#loadingStart, #loadingEnd, #skipNavi, #wrap'); // 레이어 바깥 영역의 요소
        let tabDisable;

        bodyLock();

        function lpClose() {
            // 레이어 닫기 함수
            if (tabDisable === true) lpObj.attr('tabindex', '-1');
            // lp.removeClass('on');
            lp.fadeOut('fast').removeClass('on');
            lpOuterObjHidden.removeAttr('aria-hidden');
            op.focus(); // 레이어 닫은 후 원래 있던 곳으로 초점 이동
            $(document).off('keydown.lp_keydown');
            bodyUnlock();
        }

        op.blur();
        // lp.addClass('on');
        lp.fadeIn('fast').css('display', 'flex').addClass('on');
        lpOuterObjHidden.attr('aria-hidden', 'true'); // 레이어 바깥 영역을 스크린리더가 읽지 않게
        if (lpObjTabbable.length) {
            lpObjTabbableFirst.focus().on('keydown', event => {
                // 레이어 열리자마자 초점 받을 수 있는 첫번째 요소로 초점 이동
                if (event.shiftKey && (event.keyCode || event.which) === 9) {
                    // Shift + Tab키 : 초점 받을 수 있는 첫번째 요소에서 마지막 요소로 초점 이동
                    event.preventDefault();
                    lpObjTabbableLast.focus();
                }
            });
        } else {
            lpObj
                .attr('tabindex', '0')
                .focus()
                .on('keydown', event => {
                    tabDisable = true;
                    if ((event.keyCode || event.which) === 9) event.preventDefault();
                    // Tab키 / Shift + Tab키 : 초점 받을 수 있는 요소가 없을 경우 레이어 밖으로 초점 이동 안되게
                });
        }

        lpObjTabbableLast.on('keydown', event => {
            if (!event.shiftKey && (event.keyCode || event.which) === 9) {
                // Tab키 : 초점 받을 수 있는 마지막 요소에서 첫번째 요소으로 초점 이동
                event.preventDefault();
                lpObjTabbableFirst.focus();
            }
        });

        lpObjClose.on('click', lpClose); // 닫기 버튼 클릭 시 레이어 닫기

        lp.on('click', event => {
            if (event.target === event.currentTarget) {
                // 반투명 배경 클릭 시 레이어 닫기
                lpClose();
            }
        });

        $(document).on('keydown.lp_keydown', event => {
            // Esc키 : 레이어 닫기
            const keyType = event.keyCode || event.which;

            if (keyType === 27 && lp.hasClass('on')) {
                lpClose();
            }
        });
    },
    init: () => {
        wrap = document.getElementById('wrap');
        syncHeight();

        // gnb hover
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

        // 앵커 부드럽게
        (() => {
            document.querySelectorAll('a[href^="#"]').forEach(anc => {
                anc.addEventListener('click', function (e) {
                    e.preventDefault();

                    document.querySelector(this.getAttribute('href')).scrollIntoView({
                        behavior: 'smooth',
                    });
                });
            });
        })();

        // 모바일 메뉴
        (() => {
            const mobileMenuWrap = document.querySelector('.menu-wrap');
            if (mobileMenuWrap) {
                const openBtn = mobileMenuWrap.querySelector('.menu-wrap > button');
                const menu = mobileMenuWrap.querySelector('.m-menu');
                const closeBtn = mobileMenuWrap.querySelector('.to-close');
                openBtn.addEventListener('click', () => {
                    menu.classList.add('__open');
                    bodyLock();
                });

                closeBtn.addEventListener('click', () => {
                    menu.classList.remove('__open');
                    bodyUnlock();
                });
            }

            // nav slideUpdown
            $('.m-menu nav>ul>li>button').on('click', function () {
                const parentLi = $(this).parents('li');
                $('.m-menu nav>ul>li .depth2').slideUp().attr('aria-hidden', 'true');
                $('.m-menu nav>ul>li button').attr('aria-expanded', 'false');
                if (!parentLi.hasClass('__show')) {
                    $('.m-menu nav>ul>li').removeClass('__show');
                    parentLi.addClass('__show').find('.depth2').slideDown().attr('aria-hidden', 'false');
                    parentLi.find('button').attr('aria-expanded', 'true');
                } else {
                    parentLi.removeClass('__show');
                }
            });
        })();
    },
};

document.addEventListener('DOMContentLoaded', () => {
    ui.tab();
    ui.dropdown();
    ui.accordion();
    ui.pagination();
    ui.component();
    ui.init();
});

window.addEventListener('load', () => {
    winHeight = $(window).innerHeight();
    docHeight = $('body').outerHeight();
});

window.addEventListener('resize', () => {
    // if ($(window).width() > 1024) {
    //     console.log('1024 초과');
    // }

    // if ($(window).width() <= 1024) {
    //     console.log('1024 이하 사이즈');
    // }
    syncHeight();
});

window.addEventListener('scroll', () => {
    scrollHeader();
    scrollTopBtn();
});
