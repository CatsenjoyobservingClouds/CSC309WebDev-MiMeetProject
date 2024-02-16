
document.addEventListener('DOMContentLoaded', function() {
    var today = new Date(),
        year = today.getFullYear(),
        month = today.getMonth(),
        monthTag = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        day = today.getDate(),
        days = document.getElementsByTagName('td'),
        selectedDay,
        setDate,
        daysLen = days.length;

    var timeSlotContainer = document.getElementById('time-slot-container');
    var preferenceSelect = document.getElementById('preferenceSelect');
    var selectedPreference = '';
    var selectedSlotsByDay = {};

    preferenceSelect.addEventListener('change', function() {
        selectedPreference = this.value;
    });

    var availableContacts = document.getElementById('availableContacts');
    var selectedContacts = document.getElementById('selectedContacts');

    availableContacts.addEventListener('click', function(event) {
        if (event.target.classList.contains('list-group-item')) {
            moveContact(event.target, selectedContacts);
        }
    });

    selectedContacts.addEventListener('click', function(event) {
        if (event.target.classList.contains('list-group-item')) {
            moveContact(event.target, availableContacts);
        }
    });

    function moveContact(contact, destination) {
        var existingContact = destination.querySelector('button[data-contact="' + contact.dataset.contact + '"]');
        if (!existingContact) {
            destination.appendChild(contact);
        } else {
            contact.remove();
        }
    }
    function createTimeSlot(hour, minute) {
        var timeSlot = document.createElement('div');
        timeSlot.classList.add('time-slot');

        var timePeriod = hour < 12 ? 'AM' : 'PM';
        var formattedHour = hour % 12 || 12;
        var formattedMinute = minute < 10 ? '0' + minute : minute;

        timeSlot.textContent = `${formattedHour}:${formattedMinute} ${timePeriod}`;
        timeSlot.dataset.time = `${formattedHour}:${formattedMinute} ${timePeriod}`;

        var morningColumn = document.getElementById('morning-column-modal');
        var afternoonColumn = document.getElementById('afternoon-column-modal');
        if (!morningColumn) {
            morningColumn = document.createElement('div');
            morningColumn.classList.add('column');
            morningColumn.id = 'morning-column-modal';
            document.querySelector('.modal-body').appendChild(morningColumn);
        }
        if (!afternoonColumn) {
            afternoonColumn = document.createElement('div');
            afternoonColumn.classList.add('column');
            afternoonColumn.id = 'afternoon-column-modal';
            document.querySelector('.modal-body').appendChild(afternoonColumn);
        }

        if (hour < 12) {
            morningColumn.appendChild(timeSlot);
        } else {
            afternoonColumn.appendChild(timeSlot);
        }

        timeSlot.addEventListener('mousedown', handleMouseDown);
        timeSlot.addEventListener('mouseover', handleMouseOver);
        timeSlot.addEventListener('mouseup', handleMouseUp);
        return timeSlot;
    }


    function toggleTimeSlotSelection(slot) {
        slot.classList.toggle('selected');
        if (selectedPreference === 'high') {
            slot.classList.toggle('high-preference');
        } else if (selectedPreference === 'low') {
            slot.classList.toggle('low-preference');
        }
    }

    // Mouse events handlers
    function handleMouseDown(event) {
        isMouseDown = true;
        toggleTimeSlotSelection(this);
        event.preventDefault();
    }

    function handleMouseOver() {
        if (isMouseDown) {
            toggleTimeSlotSelection(this);
        }
    }

    function handleMouseUp() {
        isMouseDown = false;
    }

    for (var hour = 0; hour < 24; hour++) {
        for (var minute = 0; minute < 60; minute += 30) {
            timeSlotContainer.appendChild(createTimeSlot(hour, minute));
        }
    }
    document.addEventListener('mouseup', handleMouseUp);

    function Calendar(selector, options) {
        this.options = options;
        this.draw();
    }

    Calendar.prototype.draw = function() {
        this.getCookie('selected_day');
        this.getOptions();
        this.drawDays();
        var that = this,
            reset = document.getElementById('reset'),
            pre = document.getElementsByClassName('pre-button'),
            next = document.getElementsByClassName('next-button');

        pre[0].addEventListener('click', function() { that.preMonth(); });
        next[0].addEventListener('click', function() { that.nextMonth(); });
        reset.addEventListener('click', function() { that.reset(); });
        for (var i = 0; i < daysLen; i++) {
            days[i].addEventListener('click', function() { that.clickDay(this); });
        }
    };

    Calendar.prototype.drawHeader = function(e) {
        var headDay = document.getElementsByClassName('head-day'),
            headMonth = document.getElementsByClassName('head-month');

        e ? headDay[0].innerHTML = e : headDay[0].innerHTML = day;
        headMonth[0].innerHTML = monthTag[month] + " - " + year;
    };

    Calendar.prototype.drawDays = function() {
        var startDay = new Date(year, month, 1).getDay(),
            nDays = new Date(year, month + 1, 0).getDate(),
            n = startDay;
        for (var k = 0; k < 42; k++) {
            days[k].innerHTML = '';
            days[k].id = '';
            days[k].className = '';
        }
        for (var i = 1; i <= nDays; i++) {
            days[n].innerHTML = i;
            n++;
        }
        for (var j = 0; j < 42; j++) {
            if (days[j].innerHTML === "") {
                days[j].id = "disabled";
            } else if (j === day + startDay - 1) {
                if ((this.options && (month === setDate.getMonth()) && (year === setDate.getFullYear())) || (!this.options && (month === today.getMonth()) && (year === today.getFullYear()))) {
                    this.drawHeader(day);
                    days[j].id = "today";
                }
            }
            if (selectedDay) {
                if ((j === selectedDay.getDate() + startDay - 1) && (month === selectedDay.getMonth()) && (year === selectedDay.getFullYear())) {
                    days[j].className = "selected";
                    this.drawHeader(selectedDay.getDate());
                }
            }
        }
    };

    Calendar.prototype.clickDay = function(o) {
        var selected = document.getElementsByClassName("selected"),
            len = selected.length;
        if (len !== 0) {
            selected[0].className = "";
        }
        o.className = "selected";
        selectedDay = new Date(year, month, o.innerHTML);
        this.drawHeader(o.innerHTML);

        // Clear previous selections in the modal
        clearTimeSlotSelections();

        // Load the saved slots for the selected day
        var dayKey = selectedDay.toISOString().split('T')[0]; // Use date as key
        if (selectedSlotsByDay[dayKey]) {
            selectedSlotsByDay[dayKey].forEach(function(slotTime) {
                var slotElement = timeSlotContainer.querySelector(`[data-time="${slotTime.time}"]`);
                if (slotElement) {
                    slotElement.classList.add('selected');
                    if (slotTime.preference === 'high') {
                        slotElement.classList.add('high-preference');
                    } else if (slotTime.preference === 'low') {
                        slotElement.classList.add('low-preference');
                    }
                }
            });
        }

        var timeSlotsModal = new bootstrap.Modal(document.getElementById('timeSlotsModal'));
        timeSlotsModal.show();
    };

    function clearTimeSlotSelections() {
        document.querySelectorAll('.time-slot').forEach(function(slot) {
            slot.classList.remove('selected', 'high-preference', 'low-preference');
        });
    }

    document.querySelector('.btn.btn-primary').addEventListener('click', function() {
        var dayKey = selectedDay.toISOString().split('T')[0];
        selectedSlotsByDay[dayKey] = [];
        document.querySelectorAll('.time-slot.selected').forEach(function(slot) {
            selectedSlotsByDay[dayKey].push({
                time: slot.dataset.time,
                preference: selectedPreference
            });
        });

        var timeSlotsModal = bootstrap.Modal.getInstance(document.getElementById('timeSlotsModal'));
        timeSlotsModal.hide();

    });

    Calendar.prototype.preMonth = function() {
        if (month < 1) {
            month = 11;
            year = year - 1;
        } else {
            month = month - 1;
        }
        this.drawHeader(1);
        this.drawDays();
    };

    Calendar.prototype.nextMonth = function() {
        if (month >= 11) {
            month = 0;
            year = year + 1;
        } else {
            month = month + 1;
        }
        this.drawHeader(1);
        this.drawDays();
    };

    Calendar.prototype.getOptions = function() {
        if (this.options) {
            var sets = this.options.split('-');
            setDate = new Date(sets[0], sets[1] - 1, sets[2]);
            day = setDate.getDate();
            year = setDate.getFullYear();
            month = setDate.getMonth();
        }
    };

    Calendar.prototype.reset = function() {
        month = today.getMonth();
        year = today.getFullYear();
        day = today.getDate();
        this.options = undefined;
        this.drawDays();
    };

    Calendar.prototype.setCookie = function(name, expiredays) {
        if (expiredays) {
            var date = new Date();
            date.setTime(date.getTime() + (expiredays * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else {
            var expires = "";
        }
        document.cookie = name + "=" + selectedDay + expires + "; path=/";
    };

    Calendar.prototype.getCookie = function(name) {
        if (document.cookie.length) {
            var arrCookie = document.cookie.split(';'),
                nameEQ = name + "=";
            for (var i = 0, cLen = arrCookie.length; i < cLen; i++) {
                var c = arrCookie[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    selectedDay = new Date(c.substring(nameEQ.length, c.length));
                }
            }
        }
    };
    var calendar = new Calendar();
}, false);
