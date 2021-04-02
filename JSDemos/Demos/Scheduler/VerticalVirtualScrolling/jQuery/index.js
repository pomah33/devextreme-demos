$(function () {
    var appointments = generateAppointments();
    $("#scheduler").dxScheduler({
        height: 600,
        dataSource: appointments,
        views: [{
            type: 'day',
            groupOrientation: 'vertical',
            name: '3 Days',
            intervalCount: 3
        }, {
            type: "workWeek",
            name: 'Work Week',
            groupOrientation: "vertical"
        }, {
            type: 'month',
            groupOrientation: 'vertical'
        }],
        startDayHour: 9,
        endDayHour: 18,
        currentView: "3 Days",
        scrolling: {
            mode: 'virtual'
        },
        showAllDayPanel: false,
        currentDate: new Date(2021, 1, 2),
        groups: ["humanId"],
        resources: [{
            fieldExpr: "humanId",
            dataSource: resources
        }]
    });
});
