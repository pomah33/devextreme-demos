QUnit.testStart(function() {
    var markup =
'<!--qunit-fixture-->\
    <div id="container">\
        <div id="treeList">\
        </div>\
    </div>\
';

    $("#qunit-fixture").html(markup);
});

require("common.css!");
require("generic_light.css!");
require("ui/tree_list/ui.tree_list");

var $ = require("jquery"),
    noop = require("core/utils/common").noop,
    devices = require("core/devices"),
    fx = require("animation/fx");

fx.off = true;

QUnit.module("Initialization", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        this.clock.restore();
    }
});

var createTreeList = function(options) {
    var treeList,
        treeListElement = $("#treeList").dxTreeList(options);

    QUnit.assert.ok(treeListElement);
    treeList = treeListElement.dxTreeList("instance");
    return treeList;
};

var generateData = function(count) {
    var i = 1,
        result = [];

    while(i < count * 2) {
        result.push({ id: i, parentId: 0 }, { id: i + 1, parentId: i });
        i += 2;
    }

    return result;
};

QUnit.test("Empty options", function(assert) {
    var treeList = createTreeList({}),
        $treeListElement = $(treeList.$element()),
        $noDataElement = $treeListElement.find(".dx-treelist-nodata");

    assert.ok(treeList);
    assert.ok($treeListElement.hasClass("dx-treelist"), "widget class on the root element");
    assert.ok($noDataElement.length, "widget have a 'no data' element");
    assert.ok($noDataElement.is(":visible"), "'No data' element is visible");
    assert.ok($treeListElement.children().hasClass("dx-treelist-container"), "container class on the child");
});

QUnit.test("Sorting should be applied on header cell click", function(assert) {
    var treeList = createTreeList({
        columns: ["name", "age"],
        dataSource: [
            { id: 1, parentId: 0, name: "Name 3", age: 19 },
            { id: 2, parentId: 0, name: "Name 1", age: 19 },
            { id: 3, parentId: 0, name: "Name 2", age: 18 }
        ]
    });

    this.clock.tick();

    // act
    var $headerCell = $(treeList.$element().find(".dx-header-row td").first());

    $($headerCell).trigger("dxclick");
    this.clock.tick();

    // assert
    var $dataRows = $(treeList.$element().find(".dx-data-row"));
    assert.equal($dataRows.eq(0).children().eq(0).text(), "Name 1", "row 0 is sorted");
    assert.equal($dataRows.eq(1).children().eq(0).text(), "Name 2", "row 1 is sorted");
    assert.equal($dataRows.eq(2).children().eq(0).text(), "Name 3", "row 2 is sorted");
    assert.equal(treeList.$element().find(".dx-sort-up").length, 1, "one sort up indicator");
    assert.equal(treeList.$element().find(".dx-header-row td").first().find(".dx-sort-up").length, 1, "sort indicator is rendered in first cell");
});

QUnit.test("Fixed column should be rendered in separate table", function(assert) {
    // act
    var treeList = createTreeList({
        columns: [{ dataField: "name", fixed: true }, "age"],
        dataSource: [
            { id: 1, parentId: 0, name: "Name 1", age: 19 }
        ]
    });

    this.clock.tick();

    // assert
    var $rowElement = $(treeList.getRowElement(0));
    assert.equal($rowElement.length, 2, "two row elements for one row");
    assert.notEqual($rowElement.eq(0).closest("table").get(0), $rowElement.eq(1).closest("table").get(0), "row elements are in different tables");
});

QUnit.test("Resize columns", function(assert) {
    // arrange
    var treeList = createTreeList({
            width: 470,
            allowColumnResizing: true,
            loadingTimeout: undefined,
            dataSource: [{ id: 1, firstName: "Dmitriy", lastName: "Semenov", room: 101, birthDay: "1992/08/06" }],
            columns: [{ dataField: "firstName", width: 100 }, { dataField: "lastName", width: 100 }, { dataField: "room", width: 100 }, { dataField: "birthDay", width: 100 }]
        }),
        headersCols,
        rowsCols,
        resizeController;

    // act
    resizeController = treeList.getController("columnsResizer");
    resizeController._isResizing = true;
    resizeController._targetPoint = { columnIndex: 1 };
    resizeController._setupResizingInfo(-9830);
    resizeController._moveSeparator({
        event: {
            data: resizeController,
            type: "mousemove",
            pageX: -9780,
            preventDefault: noop
        }
    });

    // assert
    headersCols = $(".dx-treelist-headers col");
    rowsCols = $(".dx-treelist-rowsview col");
    assert.equal($(headersCols[1]).css("width"), "150px", "width of two column - headers view");
    assert.equal($(headersCols[2]).css("width"), "50px", "width of three column - headers view");
    assert.equal($(rowsCols[1]).css("width"), "150px", "width of two column - rows view");
    assert.equal($(rowsCols[2]).css("width"), "50px", "width of three column - rows view");
});

QUnit.test("Reordering column", function(assert) {
    // arrange
    var $cellElement,
        $iconContainer,
        treeList = createTreeList({
            allowColumnReordering: true,
            loadingTimeout: undefined,
            dataSource: [{ id: 1, firstName: "1", lastName: "2", room: "3", birthDay: "4" }],
            columns: ["firstName", "lastName", "room", "birthDay"]
        }),
        columnController;

    // act
    columnController = treeList.getController("columns");
    columnController.moveColumn(0, 3);

    // assert
    $cellElement = $("#treeList").find(".dx-treelist-rowsview").find(".dx-data-row > td").first();
    $iconContainer = $("#treeList").find(".dx-treelist-rowsview").find(".dx-treelist-icon-container");
    assert.equal($iconContainer.length, 1, "count expand icon");
    assert.equal($cellElement.children(".dx-treelist-icon-container").length, 1, "first cell have expand icon");
    assert.equal($cellElement.text(), "2", "first cell value");
});

QUnit.test("Columns hiding - columnHidingEnabled is true", function(assert) {
    // arrange, act
    var $cellElement,
        treeList = createTreeList({
            width: 200,
            loadingTimeout: undefined,
            columnHidingEnabled: true,
            dataSource: [{ id: 1, firstName: "Blablablablablablablablablabla", lastName: "Psy" }],
            columns: ["firstName", "lastName"]
        });

    // assert
    $cellElement = $(treeList.$element().find(".dx-header-row > td"));
    assert.equal($cellElement.length, 3, "count cell");
    assert.equal($cellElement.eq(0).text(), "First Name", "caption of the first cell");
    assert.notOk($cellElement.eq(0).hasClass("dx-treelist-hidden-column"), "first cell is visible");
    assert.ok($cellElement.eq(1).hasClass("dx-treelist-hidden-column"), "second cell is hidden");
    assert.notOk($cellElement.eq(2).hasClass("dx-command-adaptive-hidden"), "adaptive cell is visible");

    this.clock.tick(300);

    // act
    treeList.option("width", 800);

    // assert
    $cellElement = $(treeList.$element().find(".dx-header-row > td"));
    assert.equal($cellElement.length, 3, "count cell");
    assert.equal($cellElement.eq(0).text(), "First Name", "caption of the first cell");
    assert.notOk($cellElement.eq(0).hasClass("dx-treelist-hidden-column"), "first cell is visible");
    assert.equal($cellElement.eq(1).text(), "Last Name", "caption of the second cell");
    assert.notOk($cellElement.eq(1).hasClass("dx-treelist-hidden-column"), "second cell is visible");
    assert.ok($cellElement.eq(2).hasClass("dx-command-adaptive-hidden"), "adaptive cell is hidden");
});

QUnit.test("Height rows view", function(assert) {
    // arrange, act
    var treeList = createTreeList({
        height: 200,
        showColumnHeaders: false,
        loadingTimeout: undefined,
        columnHidingEnabled: true,
        dataSource: [
            { id: 1, name: "Name 1", age: 10 },
            { id: 2, name: "Name 2", age: 11 },
            { id: 3, name: "Name 3", age: 12 },
            { id: 4, name: "Name 4", age: 13 },
            { id: 5, name: "Name 5", age: 14 },
            { id: 6, name: "Name 6", age: 15 },
            { id: 7, name: "Name 7", age: 16 }
        ]
    });

    // assert
    assert.equal(treeList.$element().find(".dx-treelist-rowsview").outerHeight(), 200, "height rows view");
});

QUnit.test("Virtual scrolling enabled by default and should render two virtual rows", function(assert) {
    var treeList = createTreeList({
        height: 50,
        paging: { pageSize: 2, pageIndex: 1 },
        columns: ["name", "age"],
        dataSource: [
            { id: 1, parentId: 0, name: "Name 1", age: 19 },
            { id: 2, parentId: 0, name: "Name 2", age: 19 },
            { id: 3, parentId: 0, name: "Name 3", age: 18 },
            { id: 4, parentId: 0, name: "Name 4", age: 18 },
            { id: 5, parentId: 0, name: "Name 5", age: 18 },
            { id: 6, parentId: 0, name: "Name 6", age: 18 },
            { id: 7, parentId: 0, name: "Name 7", age: 18 },
            { id: 8, parentId: 0, name: "Name 8", age: 18 }
        ]
    });

    // act
    this.clock.tick();

    // assert
    assert.equal(treeList.option("scrolling.mode"), "virtual", "scrolling mode is virtual");
    var $rowsViewTables = $(treeList.$element().find(".dx-treelist-rowsview table"));
    assert.equal($rowsViewTables.length, 1, "one table are rendered");
    assert.equal($rowsViewTables.eq(0).find(".dx-data-row").length, 4, "data rows in table");
    assert.equal($rowsViewTables.eq(0).find(".dx-virtual-row").length, 2, "two virtual rows in table");
    assert.equal($rowsViewTables.eq(0).find(".dx-freespace-row").length, 1, "one freespace row in table");
});


QUnit.testInActiveWindow("Ctrl + left/right keys should collapse/expand row", function(assert) {
    if(devices.real().deviceType !== "desktop") {
        assert.ok(true, "keyboard navigation is disabled for not desktop devices");
        return;
    }
    var treeList = createTreeList({
            columns: ["name", "age"],
            dataSource: [
                { id: 1, parentId: 0, name: "Name 1", age: 19 },
                { id: 2, parentId: 0, name: "Name 2", age: 19 },
                { id: 3, parentId: 2, name: "Name 3", age: 18 }
            ]
        }),
        navigationController = treeList.getController("keyboardNavigation");

    this.clock.tick();

    treeList.focus($(treeList.getCellElement(1, 0)));
    this.clock.tick();

    // act
    navigationController._keyDownHandler({ key: "rightArrow", ctrl: true, originalEvent: $.Event("keydown", { target: treeList.getCellElement(1, 0) }) });
    this.clock.tick();

    // assert
    assert.ok(treeList.isRowExpanded(2), "second row is expanded");

    // act
    navigationController._keyDownHandler({ key: "leftArrow", ctrl: true, originalEvent: $.Event("keydown", { target: treeList.getCellElement(1, 0), ctrl: true }) });
    this.clock.tick();

    // assert
    assert.notOk(treeList.isRowExpanded(2), "second row is collapsed");
});

QUnit.test("Filter Row", function(assert) {
    var treeList = createTreeList({
        filterRow: {
            visible: true
        },
        columns: ["name", { dataField: "age", filterValue: 19 }],
        dataSource: [
            { id: 1, parentId: 0, name: "Name 3", age: 19 },
            { id: 2, parentId: 0, name: "Name 1", age: 19 },
            { id: 3, parentId: 0, name: "Name 2", age: 18 }
        ]
    });

    // act
    this.clock.tick();

    // assert
    assert.equal(treeList.$element().find(".dx-data-row").length, 2, "two filtered rows are rendered");
    assert.equal(treeList.$element().find(".dx-treelist-filter-row").length, 1, "filter row is rendered");
});

// T516918
QUnit.test("Filter menu items should have icons", function(assert) {
    // arrange
    var $filterMenuElement,
        $menuItemElements,
        treeList = createTreeList({
            filterRow: {
                visible: true
            },
            columns: ["name", { dataField: "age", filterValue: 19 }],
            dataSource: [
                { id: 1, parentId: 0, name: "Name 3", age: 19 },
                { id: 2, parentId: 0, name: "Name 1", age: 19 },
                { id: 3, parentId: 0, name: "Name 2", age: 18 }
            ]
        });

    this.clock.tick();

    // act
    $filterMenuElement = $(treeList.$element().find(".dx-treelist-filter-row").find(".dx-menu").first().find(".dx-menu-item"));
    $($filterMenuElement).trigger("dxclick"); // show menu

    // assert
    $menuItemElements = $(".dx-overlay-wrapper").find(".dx-menu-item");
    assert.ok($menuItemElements.length > 0, "has filter menu items");
    assert.equal($menuItemElements.first().find(".dx-icon").css("fontFamily"), "DXIcons", "first item has icon");
});

QUnit.test("Header Filter", function(assert) {
    var treeList = createTreeList({
        headerFilter: {
            visible: true
        },
        columns: ["name", { dataField: "age", filterValues: [19] }],
        dataSource: [
            { id: 1, parentId: 0, name: "Name 3", age: 19 },
            { id: 2, parentId: 0, name: "Name 1", age: 19 },
            { id: 3, parentId: 0, name: "Name 2", age: 18 }
        ]
    });

    // act
    this.clock.tick();

    // assert
    assert.equal(treeList.$element().find(".dx-data-row").length, 2, "two filtered rows are rendered");
    assert.equal(treeList.$element().find(".dx-header-filter").length, 2, "two header filter icons area rendered");
});

QUnit.test("Expanding of all items should work correctly after clearing filter", function(assert) {
    var treeList = createTreeList({
        headerFilter: {
            visible: true
        },
        autoExpandAll: true,
        columns: ["name", { dataField: "age", filterValues: [19], allowFiltering: true }, "gender"],
        dataSource: [
            { id: 1, parentId: 0, name: "Name 3", age: 19, gender: "male" },
            { id: 2, parentId: 1, name: "Name 1", age: 19, gender: "female" },
            { id: 3, parentId: 1, name: "Name 2", age: 18, gender: "male" },
            { id: 4, parentId: 2, name: "Name 4", age: 19, gender: "male" },
            { id: 5, parentId: 2, name: "Name 5", age: 20, gender: "female" },
            { id: 6, parentId: 3, name: "Name 6", age: 18, gender: "male" }
        ]
    });

    this.clock.tick();
    assert.equal(treeList.$element().find(".dx-data-row").length, 3, "filtered rows are rendered");
    treeList.filter("gender", "=", "male");
    this.clock.tick();
    assert.equal(treeList.$element().find(".dx-data-row").length, 3, "filtered rows are rendered");

    // act
    treeList.clearFilter();
    this.clock.tick();

    // assert
    assert.equal(treeList.$element().find(".dx-data-row").length, 6, "six filtered rows are rendered");
});

QUnit.test("Items should be collapsed after clearing filter, autoExpandAll = false", function(assert) {
    var treeList = createTreeList({
        headerFilter: {
            visible: true
        },
        autoExpandAll: false,
        columns: ["name", { dataField: "age", filterValues: [19], allowFiltering: true }],
        dataSource: [
            { id: 1, parentId: 0, name: "Name 3", age: 19 },
            { id: 2, parentId: 1, name: "Name 1", age: 19 },
            { id: 3, parentId: 2, name: "Name 2", age: 18 },
            { id: 4, parentId: 0, name: "Name 4", age: 19 },
            { id: 5, parentId: 4, name: "Name 5", age: 20 },
            { id: 6, parentId: 5, name: "Name 6", age: 18 }
        ]
    });

    this.clock.tick();
    assert.equal(treeList.$element().find(".dx-data-row").length, 3, "filtered rows are rendered");

    // act
    treeList.clearFilter();
    this.clock.tick();

    // assert
    assert.equal(treeList.$element().find(".dx-data-row").length, 2, "two rows are rendered");
});

QUnit.test("Search Panel", function(assert) {
    var treeList = createTreeList({
        columns: ["name", "age"],
        searchPanel: {
            visible: true,
            text: "Name 1"
        },
        dataSource: [
            { id: 1, parentId: 0, name: "Name 3", age: 19 },
            { id: 2, parentId: 0, name: "Name 1", age: 19 },
            { id: 3, parentId: 0, name: "Name 2", age: 18 }
        ]
    });

    // act
    this.clock.tick();


    // assert
    assert.equal(treeList.$element().find(".dx-data-row").length, 1, "one filtered row is rendered");
    assert.equal(treeList.$element().find(".dx-toolbar .dx-searchbox").length, 1, "searchPanel is rendered");
    assert.equal(treeList.$element().find(".dx-toolbar .dx-searchbox").dxTextBox("instance").option("value"), "Name 1", "searchPanel text is applied");
});

QUnit.test("Selectable treeList should have right default options", function(assert) {
    var treeList = createTreeList({
        columns: ["name", "age"],
        selection: { mode: 'multiple' },
        dataSource: [
            { id: 1, parentId: 0, name: "Name 3", age: 19 },
            { id: 2, parentId: 0, name: "Name 1", age: 19 },
            { id: 3, parentId: 0, name: "Name 2", age: 18 }
        ]
    });

    // act
    this.clock.tick();

    // assert
    assert.equal(treeList.option("selection.showCheckBoxesMode"), "always", "showCheckBoxesMode is always");
});

QUnit.test("Click on selectCheckBox shouldn't render editor, editing & selection", function(assert) {
    createTreeList({
        columns: ["name", "age"],
        selection: { mode: 'multiple' },
        editing: {
            mode: "batch",
            allowUpdating: true
        },
        dataSource: [
            { id: 1, parentId: 0, name: "Name 3", age: 19 }
        ]
    });

    // act
    this.clock.tick();
    var $selectCheckbox = $("#treeList").find(".dx-treelist-cell-expandable").eq(0).find(".dx-select-checkbox").eq(0);
    $($selectCheckbox).trigger("dxclick");
    this.clock.tick();

    // assert
    assert.notOk($("#treeList").find(".dx-texteditor").length, "Editing textEditor wasn't rendered");
});

QUnit.test("Filter row should not contains selection checkboxes", function(assert) {
    createTreeList({
        columns: ["name", "age"],
        selection: { mode: 'multiple' },
        filterRow: {
            visible: true
        },
        dataSource: [
            { id: 1, parentId: 0, name: "Name 3", age: 19 }
        ]
    });

    // act
    this.clock.tick();

    // assert
    assert.equal($("#treeList").find(".dx-treelist-filter-row").length, 1, "filter row is rendered");
    assert.equal($("#treeList").find(".dx-checkbox").length, 2, "selection chebkboxes are rendered");
    assert.equal($("#treeList").find(".dx-treelist-filter-row .dx-checkbox").length, 0, "no selection chebkboxes in filter row");
});

QUnit.test("Aria accessibility", function(assert) {
    // arrange, act
    var $dataRows,
        $headerTable,
        $dataTable,
        $treeList,
        treeList = createTreeList({
            dataSource: [
                { id: 1, parentId: 0, name: "Name 1", age: 19 },
                { id: 2, parentId: 1, name: "Name 2", age: 19 },
                { id: 3, parentId: 2, name: "Name 3", age: 18 },
                { id: 4, parentId: 0, name: "Name 4", age: 18 }
            ],
            expandedRowKeys: [1]
        });

    this.clock.tick();

    // assert
    $treeList = $(treeList.$element());

    assert.equal($treeList.find(".dx-gridbase-container").attr("role"), "treegrid", "treeList base container - value of 'role' attribute");

    $headerTable = $treeList.find(".dx-treelist-headers table").first();
    assert.equal($headerTable.attr("role"), "presentation", "header table - value of 'role' attribute");

    $dataTable = $treeList.find(".dx-treelist-rowsview table").first();
    assert.equal($dataTable.attr("role"), "presentation", "data table - value of 'role' attribute");

    $dataRows = $dataTable.find(".dx-data-row");
    assert.equal($dataRows.eq(0).attr("aria-expanded"), "true", "first data row - value of 'aria-expanded' attribute");
    assert.equal($dataRows.eq(0).attr("aria-level"), "0", "first data row - value of 'aria-level' attribute");
    assert.equal($dataRows.eq(1).attr("aria-expanded"), "false", "second data row - value of 'aria-expanded' attribute");
    assert.equal($dataRows.eq(1).attr("aria-level"), "1", "second data row - value of 'aria-level' attribute");
    assert.equal($dataRows.eq(2).attr("aria-expanded"), undefined, "third data row hasn't the 'aria-expanded' attribute");
    assert.equal($dataRows.eq(2).attr("aria-level"), "0", "third data row - value of 'aria-level' attribute");
});

// T632028
QUnit.test("Display context menu", function(assert) {
    // arrange, act
    var contextMenuItems = [{ text: "test" }],
        treeList = createTreeList({
            dataSource: [
                { id: 1 }
            ],
            onContextMenuPreparing: function($event) {
                $event.items = contextMenuItems;
            }
        });

    this.clock.tick();

    var $cellElement = $(treeList.getCellElement(0, 0));
    $cellElement.trigger("contextmenu");
    var contextMenuInstance = treeList.getView("contextMenuView").element().dxContextMenu("instance");

    // assert
    assert.ok(contextMenuInstance);
    assert.deepEqual(contextMenuInstance.option("items"), contextMenuItems);
});

QUnit.test("filterSyncEnabled is working in TreeList", function(assert) {
    // act
    var treeList = createTreeList({
        filterSyncEnabled: true,
        columns: [{ dataField: "field", allowHeaderFiltering: true, filterValues: [2] }]
    });

    // act
    treeList.columnOption("field", { filterValues: [2, 1] });

    // assert
    assert.deepEqual(treeList.option("filterValue"), ["field", "anyof", [2, 1]]);
});

QUnit.test("filterBulider is working in TreeList", function(assert) {
    // arrange
    var handlerInit = sinon.spy();

    // act
    var treeList = createTreeList({
        filterBuilder: {
            onInitialized: handlerInit
        },
        columns: [{ dataField: "field" }]
    });

    // assert
    assert.equal(handlerInit.called, 0);

    // act
    treeList.option("filterBuilderPopup.visible", true);

    // assert
    assert.equal(handlerInit.called, 1);
});

QUnit.test("TreeList with paging", function(assert) {
    // arrange, act
    var $treeListElement,
        treeList = createTreeList({
            autoExpandAll: true,
            dataSource: generateData(5),
            paging: {
                pageSize: 5
            },
            pager: {
                visible: true,
                showPageSizeSelector: true,
                allowedPageSizes: [2, 5, 8]
            }
        });

    this.clock.tick();

    // assert
    $treeListElement = $(treeList.$element());
    assert.strictEqual($treeListElement.find(".dx-treelist-pager").length, 1, "has pager");
    assert.strictEqual($treeListElement.find(".dx-page").length, 2, "number of containers for page");
    assert.ok($treeListElement.find(".dx-page").first().hasClass("dx-selection"), "current page - first");
    assert.strictEqual($treeListElement.find(".dx-page-size").length, 3, "number of containers for page sizes");
});

QUnit.module("Option Changed", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        this.clock.restore();
    }
});

QUnit.test("Change dataSource, selectedRowKeys and scrolling options together", function(assert) {
    // arrange
    var treeList = createTreeList({});
    this.clock.tick(30);

    // act
    treeList.option({
        dataSource: [{ id: 1 }],
        selectedRowKeys: [1],
        scrolling: { mode: "virtual" }
    });
    this.clock.tick(30);

    // assert
    assert.strictEqual(treeList.getVisibleRows().length, 1, "row count");
});

// T575440
QUnit.test("Change options and call selectRows", function(assert) {
    // arrange

    var createOptions = function() {
        return {
            dataSource: [{
                id: 1,
                text: "Brazil"
            }, {
                id: 2,
                text: "Spain"
            }, {
                id: 3,
                text: "USA"
            }],
            selectedRowKeys: [1, 2, 3],
            selection: {
                mode: "multiple",
                recursive: true
            },
            scrolling: {
                mode: "virtual"
            }
        };
    };

    var treeList = createTreeList(createOptions());
    this.clock.tick(30);

    // act
    treeList.option(createOptions());
    treeList.selectRows([1, 2, 3]);
    this.clock.tick(30);

    // assert
    assert.strictEqual(treeList.getSelectedRowsData().length, 3, "selected rows");
});

// T576806
QUnit.test("Pages should be correctly loaded after change dataSource and selectedRowKeys options", function(assert) {
    var treeList = createTreeList({
        height: 1500,
        autoExpandAll: true
    });

    this.clock.tick(300);

    // act
    treeList.option({
        dataSource: generateData(20),
        selectedRowKeys: [1]
    });
    this.clock.tick(0);

    // assert
    assert.strictEqual(treeList.getVisibleRows().length, 40, "row count");
});

// T591390
QUnit.test("Change expandedRowKeys", function(assert) {
    // arrange
    var treeList = createTreeList({
        dataSource: [
            { id: 1, parentId: 0, name: "Name 1", age: 16 },
            { id: 2, parentId: 1, name: "Name 2", age: 17 },
            { id: 3, parentId: 2, name: "Name 3", age: 18 }
        ]
    });
    this.clock.tick(30);

    // assert
    assert.strictEqual(treeList.getVisibleRows().length, 1, "row count");

    // act
    treeList.option("expandedRowKeys", [1, 2]);
    this.clock.tick(30);

    // assert
    assert.strictEqual(treeList.getVisibleRows().length, 3, "row count");
});

QUnit.test("TreeList with columnAutoWidth should be rendered", function(assert) {
    // act
    var treeList = createTreeList({
        columnAutoWidth: true,
        columns: ["name", "age"],
        dataSource: [
            { id: 1, parentId: 0, name: "Name 1", age: 19 }
        ]
    });

    this.clock.tick();

    // assert
    assert.equal(treeList.$element().find(".dx-treelist-headers .dx-header-row").length, 1, "header row is rendered");
    assert.equal(treeList.$element().find(".dx-treelist-rowsview .dx-data-row").length, 1, "data row is rendered");
});

QUnit.test("Virtual columns", function(assert) {
    // arrange, act
    var columns = [];

    for(var i = 1; i <= 20; i++) {
        columns.push("field" + i);
    }

    var treeList = createTreeList({
        width: 200,
        columnWidth: 50,
        dataSource: [{}],
        columns: columns,
        scrolling: {
            columnRenderingMode: "virtual"
        }
    });

    this.clock.tick(0);

    // assert
    assert.equal(treeList.getVisibleColumns().length, 6, "visible column count");
});

QUnit.test("Call getSelectedRowKeys with 'leavesOnly' parameter and wrong selectedKeys after dataSource change", function(assert) {
    var treeList = createTreeList({
        dataSource: [
            { id: 1, field1: 'test1' },
            { id: 2, parentId: 1, field1: 'test2' },
            { id: 3, field1: 'test3' }
        ],
        selection: {
            mode: "multiple",
            recursive: true
        },
        selectedRowKeys: [1, 3],
    });
    this.clock.tick(30);

    // act
    treeList.option({
        dataSource: [
            { id: 1, field1: 'test1' },
            { id: 2, parentId: 1, field1: 'test2' }
        ]
    });

    // assert
    assert.deepEqual(treeList.getSelectedRowKeys("leavesOnly"), [], "dataSource is not loaded yet");

    this.clock.tick(30);
    assert.deepEqual(treeList.getSelectedRowKeys("leavesOnly"), [2], "dataSource is reloaded");
});

// T664886
QUnit.test("Highlight searchText in expandable column", function(assert) {
    var treeList = createTreeList({
            dataSource: [
                { id: 1, parentId: 0, name: "Name 1", age: 16 },
                { id: 2, parentId: 1, name: "Name 2", age: 17 },
                { id: 3, parentId: 2, name: "Name", age: 18 }
            ],
            searchPanel: {
                text: "3"
            }
        }),
        searchTextSelector = ".dx-treelist-search-text";

    this.clock.tick(30);

    assert.equal(treeList.$element().find(searchTextSelector).length, 1);
});

QUnit.module("Expand/Collapse rows");

// T627926
QUnit.test("Nodes should not be shifted after expanding node on last page", function(assert) {
    // arrange
    var done = assert.async(),
        topVisibleRowData,
        treeList = createTreeList({
            height: 120,
            loadingTimeout: undefined,
            paging: {
                enabled: true,
                pageSize: 2
            },
            scrolling: {
                mode: "virtual"
            },
            expandedRowKeys: [1],
            dataSource: [
                { name: 'Category1', id: 1 },
                    { name: 'SubCategory1', id: 2, parentId: 1 },
                    { name: 'SubCategory2', id: 3, parentId: 1 },
                { name: 'Category2', id: 4 },
                { name: 'Category3', id: 5 },
                { name: 'Category4', id: 6 },
                { name: 'Category7', id: 7 },
                { name: 'Category5', id: 8 },
                    { name: 'SubCategory3', id: 9, parentId: 8 },
                        { name: 'SubCategory5', id: 12, parentId: 9 },
                    { name: 'SubCategory4', id: 10, parentId: 8 },
                { name: 'Category6', id: 11 }
            ]
        });

    treeList.getScrollable().scrollTo({ y: 300 }); // scroll to the last page

    setTimeout(function() {
        topVisibleRowData = treeList.getTopVisibleRowData();

        // assert
        assert.strictEqual(treeList.pageIndex(), 4, "page index");
        assert.strictEqual(treeList.pageCount(), 5, "page count");

        // act
        treeList.expandRow(8);
        treeList.expandRow(9);

        // assert
        assert.strictEqual(treeList.pageIndex(), 3, "page index");
        assert.strictEqual(treeList.pageCount(), 6, "page count");
        assert.deepEqual(treeList.getTopVisibleRowData(), topVisibleRowData, "top visible row data has not changed");
        done();
    }, 100);
});

// T648005
QUnit.test("Scrollbar position must be kept after expanding node when the treelist container has max-height", function(assert) {
    // arrange
    $("#treeList").css("max-height", 400);

    var done = assert.async(),
        treeList = createTreeList({
            loadingTimeout: undefined,
            scrolling: {
                mode: "virtual",
                useNative: false
            },
            dataSource: generateData(100)
        });

    treeList.getScrollable().scrollTo({ y: 1000 });

    setTimeout(function() {
        // act
        treeList.expandRow(69);

        setTimeout(function() {
            // assert
            assert.ok($(treeList.element()).find(".dx-treelist-rowsview .dx-scrollbar-vertical > .dx-scrollable-scroll").position().top > 0, "scrollbar position top");
            done();
        }, 310);
    });
});

QUnit.module("Focused Row", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        this.clock.restore();
    }
});

QUnit.test("TreeList with focusedRowEnabled and focusedRowIndex 0", function(assert) {
    // arrange, act
    var treeList = createTreeList({
        dataSource: generateData(5),
        focusedRowEnabled: true,
        focusedRowIndex: 0
    });

    this.clock.tick();

    // assert
    assert.ok($(treeList.getRowElement(0)).hasClass("dx-row-focused"), "first row is focused");
});

QUnit.test("TreeList with focusedRowKey", function(assert) {
    // arrange, act
    var treeList = createTreeList({
        dataSource: generateData(10),
        paging: {
            pageSize: 4
        },
        focusedRowEnabled: true,
        focusedRowKey: 12
    });

    this.clock.tick();

    // assert
    assert.equal(treeList.pageIndex(), 1, "page is changed");
    assert.deepEqual(treeList.option("expandedRowKeys"), [11], "focus parent is expanded");
    assert.ok($(treeList.getRowElement(treeList.getRowIndexByKey(12))).hasClass("dx-row-focused"), "focused row is visible");
});

QUnit.test("TreeList with remoteOperations and focusedRowKey", function(assert) {
    // arrange, act
    var treeList = createTreeList({
        dataSource: generateData(10),
        remoteOperations: true,
        paging: {
            pageSize: 4
        },
        focusedRowEnabled: true,
        focusedRowKey: 12
    });

    this.clock.tick();

    // assert
    assert.equal(treeList.pageIndex(), 1, "page is changed");
    assert.deepEqual(treeList.option("expandedRowKeys"), [11], "focus parent is expanded");
    assert.ok($(treeList.getRowElement(treeList.getRowIndexByKey(12))).hasClass("dx-row-focused"), "focused row is visible");
});

QUnit.test("TreeList navigateTo", function(assert) {
    // arrange, act
    var treeList = createTreeList({
        dataSource: generateData(10),
        paging: {
            pageSize: 4
        }
    });

    this.clock.tick();

    treeList.navigateToRow(12);
    this.clock.tick();

    // assert
    assert.equal(treeList.pageIndex(), 1, "page is changed");
    assert.ok(treeList.getRowIndexByKey(12) >= 0, "key is visible");
});
