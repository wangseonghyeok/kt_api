document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendarBox');

    // eslint-disable-next-line no-undef
    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'ko',
        timeZone: 'UTC',
        headerToolbar: {
            left: 'prev',
            center: 'title',
            right: 'next',
        },
        editable: true,

        events: [
            {
                className: 'fc-day-closed',
                title: '마감',
                start: '2023-12-10',
                end: '2023-12-10',
            },
            {
                className: 'fc-day-closed',
                title: '마감',
                start: '2023-12-25',
                end: '2023-12-25',
            },
            {
                className: 'fc-day-closed',
                title: '마감',
                start: '2023-12-29',
                end: '2023-12-29',
            },
            {
                className: 'fc-day-closed',
                title: '마감',
                start: '2024-01-10',
                end: '2024-01-10',
            },
        ],

        // 날짜 '일' 제거
        dayCellContent(info) {
            const number = document.createElement('a');
            number.classList.add('fc-daygrid-day-number');
            number.innerHTML = info.dayNumberText.replace('일', '');
            if (info.view.type === 'dayGridMonth') {
                return {
                    html: number.outerHTML,
                };
            }
            return {
                domNodes: [],
            };
        },

        // dateClick(info) {
        //     const days = document.querySelectorAll('.fc-day');
        //     const viewSelectDayTxt = document.querySelector('.date-selected > p');

        //     // 예약 가능한 날짜 선택시 fc-day-active 클래스 추가
        //     const classNames = [
        //         'fc-day-past',
        //         'fc-day-today',
        //         'fc-day-other',
        //         'fc-day-sat',
        //         'fc-day-sun',
        //         'fc-day-closed-text',
        //     ];
        //     if (!classNames.some(className => info.dayEl.classList.contains(className))) {
        //         days.forEach(day => {
        //             if (day.classList.contains('fc-day-active')) {
        //                 day.classList.remove('fc-day-active');
        //             }
        //         });
        //         info.dayEl.classList.add('fc-day-active');
        //         const selectedDayTxt = info.dayEl.querySelector('.fc-daygrid-day-top > a');

        //         viewSelectDayTxt.innerText = `${selectedDayTxt.getAttribute('aria-label')}`;
        //     }
        // },
    });

    calendar.render();

    $(() => {
        // fullcalendar로 지정한 마감날에 '마감' 텍스트 표시
        const dayClosed = () => {
            if ($('.fc-day-closed')) {
                $('.fc-day-closed').closest('.fc-day').addClass('fc-day-closed-text');
            }
        };

        // 날짜 a태그에 href 추가
        // 신청 불가능 날짜에 fc-disabled 클래스 추가
        const daysInit = () => {
            const days = $('.fc-daygrid-day-number[aria-label]');
            const disableDays = document.querySelectorAll(
                '.fc-day-past, .fc-day-today, .fc-day-other, .fc-day-sat, .fc-day-sun, .fc-day-closed-text',
            );
            const script = 'javascript:void(0);';
            days.prop('href', script);

            disableDays.forEach(el => {
                el.classList.add('fc-disabled');
                el.querySelector('a[aria-label]').removeAttribute('href');
            });

            days.on('click', function () {
                if (!$(this).closest('[role="gridcell"]').hasClass('fc-disabled')) {
                    $('[role="gridcell"]').removeClass('fc-day-active');
                    $(this).closest('[role="gridcell"]').addClass('fc-day-active');
                }
            });
        };

        const tableInit = () => {
            const prevMonth = $('.fc-toolbar-chunk .fc-prev-button');
            const nextMonth = $('.fc-toolbar-chunk .fc-next-button');
            const grdTbl = $('.fc-scrollgrid');
            const headerTbl = $('.fc-col-header');
            const bodyTbl = $('.fc-scrollgrid-sync-table');
            const headerDay = $('.fc-col-header-cell');
            grdTbl
                .prepend('<caption class="blind">테스트랩 이용신청 캘린더</caption>')
                .append('<tfoot class="blind"></tfoot>')
                .attr('summary', '테스트랩 이용을 신청할 수 있습니다.');
            headerTbl
                .prepend('<caption class="blind">테스트랩 이용신청 요일</caption>')
                .append('<tbody class="blind"></tbody><tfoot class="blind"></tfoot>')
                .attr('summary', '테스트랩 이용을 신청할 수 있습니다.');
            bodyTbl
                .prepend(
                    '<caption class="blind">테스트랩 이용신청 날짜 선택</caption><thead class="blind"><tr><th scope="col">일</th><th scope="col">월</th><th scope="col">화</th><th scope="col">수</th><th scope="col">목</th><th scope="col">금</th><th scope="col">토</th></tr></thead>',
                )
                .append('<tfoot class="blind"></tfoot>')
                .attr('summary', '테스트랩 이용을 신청할 수 있습니다.');
            headerDay.prop('scope', 'col');
        };

        $('.fc-prev-button, .fc-next-button').on('click', () => {
            dayClosed();
            daysInit();
        });
        dayClosed();
        daysInit();
        tableInit();
    });
});
