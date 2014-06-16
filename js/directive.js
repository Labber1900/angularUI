/**
 * Created by obladi on 14-6-5.
 */
angular.module("ui",[])
    .factory("Handlebars", function () {
        return Handlebars;
    })
/**
 * 常量类<p>
 * 配置固定的一些常量等，格式为javaScript对象
 * @example
 * {
     *     css :{
     *        tree : {
     *            type : {
     *               normal : "normal",
     *               checkbox : "checkbox"
     *            }
     *        }
     *     },
     *     get : function(key){
     *       ...
     *     }
     * }
 * 通过get("css.tree.type.normal")获取字符串对应的值
 */
    .factory("constant", function () {
        return {
            tree: {
                checkTypes: {
                    types: ["check", "unCheck", "partial"],
                    mapping: {
                        "check": "unCheck",
                        "unCheck": "check",
                        "partial": "check"
                    },
                    direction: {
                        "check": 1,
                        "unCheck": -1,
                        "partial": 0
                    }
                }
            },
            get: function (key) {
                var keys = key.split("."), data = this;
                while (keys.length) {
                    data = data[keys.shift()];
                }
                return data;
            }
        }
    })
    .directive("tabs", function () {
        return {
            restrict: 'E',
            transclude: true,
            scope: {},
            controller: function ($scope) {
                var panes = $scope.panes = [];
                this.scope = $scope;
                $scope.select = function (pane) {
                    angular.forEach(panes, function (pane) {
                        pane.selected = false;
                    });
                    pane.selected = true;
                };
                this.addPane = function (pane) {
                    if (panes.length === 0) {
                        $scope.select(pane);
                    }
                    panes.push(pane);
                };
            },
            templateUrl: '../templates/template-tabs.html'
        };
    })
    .directive("pane", function () {
        return {
            require: '^tabs',
            restrict: 'E',
            transclude: true,
            scope: {
                title: '@'
            },
            link: function (scope, element, attrs, tabsCtrl) {
                tabsCtrl.addPane(scope);
            },
            templateUrl: '../templates/template-pane.html'
        };
    })
/**
 * 日历选择指令<p>
 * 需要绑定一个值，用于监听日历所选日期的变化<p>
 * @example
 <calendar ng-model="date"></calendar>
 */
    .directive("calendar", function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            require: ["?ngModel"],
            scope: {
                selected: "=ngModel"
            },
            link: function ($scope) {
                var number = 42,
                    today = new Date(),
                    year = $scope.selected ? $scope.selected.getFullYear() : today.getFullYear(),
                    month = $scope.selected ? $scope.selected.getMonth() : today.getMonth();
                $scope.weeks = ['日', '一', '二', '三', '四', '五', '六'];
                $scope.today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                $scope.month = month;
                $scope.year = year;
                $scope.reset = function (year, month) {
                    $scope.year = year;
                    $scope.month = month;
                    var result = [], day1 = new Date(year, month, 1),
                        _day1 = new Date(day1.getTime() - (day1.getDay() != 0 ? day1.getDay() : 0) * 1000 * 60 * 60 * 24);
                    for (var i = 0; i < number; i++) {
                        var newDate = new Date();
                        if (i % 7 == 0) {
                            result.push([]);
                        }
                        newDate.setTime(_day1.getTime() + i * 1000 * 60 * 60 * 24);
                        result[result.length - 1].push(newDate);
                    }

                    $scope.first = day1;
                    $scope.end = new Date(year, month + 1, 0);
                    $scope.days = result;
                };
                $scope.lastMonth = function () {
                    var month = $scope.month == 0 ? 11 : $scope.month - 1,
                        year = month == 11 ? $scope.year - 1 : $scope.year;
                    $scope.reset(year, month);
                };
                $scope.nextMonth = function () {
                    var month = $scope.month == 11 ? 0 : $scope.month + 1,
                        year = month == 0 ? $scope.year + 1 : $scope.year;
                    $scope.reset(year, month);
                };
                $scope.nextYear = function () {
                    $scope.reset($scope.year + 1, $scope.month);
                };
                $scope.lastYear = function () {
                    $scope.reset($scope.year - 1, $scope.month);
                };
                $scope.toToday = function () {
                    var date = new Date();
                    $scope.reset(date.getFullYear(), date.getMonth());
                };
                $scope.select = function (date) {
                    $scope.selected = date;
                    if (date.getFullYear() != $scope.year || date.getMonth() != $scope.month) {
                        $scope.reset(date.getFullYear(), date.getMonth());
                    }
                };
                $scope.select($scope.selected);
                $scope.reset(year, month);

            },
            templateUrl: "../templates/template-calendar.html"
        };
    })
/**
 * 日期指令<p>
 * 依赖calendar指令<p>
 * @example
 * <date ng-model="date" format="yyyy年MM月dd日"></date>
 */
    .directive("date", function () {
        return {
            require: '?calendar',
            restrict: 'E',
            scope: {
                value: '=ngModel'
            },
            link: function ($scope, element, attrs) {
                $scope.format = attrs.format ? attrs.format : 'yyyy-MM-dd';
            },
            templateUrl: '../templates/template-date.html'
        };
    })

    .factory("treeEventHandler", ["constant","Handlebars",function (constant,Handlebars) {
        return function ($scope,treeNodeTemplate) {
            var checkTypes = constant.get("tree.checkTypes.types"),
                opposites = constant.get("tree.checkTypes.mapping"),
                direction = constant.get("tree.checkTypes.direction"),
                getCheckType = function (treeNode) {
                    var result = checkTypes[0], children = treeNode.children, length = children.length, count = 0;
                    while (length--) {
                        if ($("#" + children[length].id).hasClass(checkTypes[1])) {
                            count++;
                        } else if ($("#" + children[length].id).hasClass(checkTypes[2])) {
                            count = count + 0.5;
                        }
                    }
                    switch (count) {
                        case 0:
                            result = checkTypes[0];
                            break;
                        case children.length:
                            result = checkTypes[1];
                            break;
                        default:
                            result = checkTypes[2];
                            break;

                    }
                    return result;
                },
                changeState = function (target, changeTo, stopPropagation) {
                    var treeNode = $scope.cache.get(target.attr("id")),
                        parentNode = treeNode.parent ? $scope.cache.get(treeNode.parent) : null,
                        parentDom = treeNode.parent ? $("#" + treeNode.parent) : null;
                    target.removeClass(checkTypes.join(" ")).addClass(changeTo);
                    if (!stopPropagation && treeNode.children && treeNode.children.length > 0) {
                        var children = target.find(".treeNode"), id = children.attr("id"), treeNode = $scope.cache.get(id);
                        //设置所有子结点的状态，此时子结点要么选中，要么取消选中
                        children.removeClass(checkTypes.join(" ")).addClass(changeTo);
                    }
                    //设置所有父节点状态
                    if (parentNode) {
                        var checkType = getCheckType(parentNode);
                        changeState(parentDom, checkType, true);
                    }
                },
                binding = function (element) {
                    element.find(".treeNode").click(onClick);
                    if ($scope.isCheckboxTree) {
                        //多选树
                        element.find(".treeNode").find(".selector").click(onCheck);
                    } else {
                        //单选树
                        element.find(".treeNode").filter(function () {
                            var children = $scope.cache.get($(this).attr("id")).children;
                            return !children || children.length == 0;
                        }).click(onSelected);
                    }
                },
                onCheck = function (event) {
                    var id = $(this).attr("node"), treeNodeDom = $("#" + id), treeNode = $scope.cache.get(id);
                    $(checkTypes).each(function () {
                        if (treeNodeDom.hasClass(this)) {
                            $scope.check(treeNode, opposites[this] == checkTypes[0]);
                            changeState(treeNodeDom, opposites[this]);
                            return false;
                        }
                    });
                    //设置返回值value
                    var result = [],getLevel = function(treeNode){
                        var parent = $scope.cache.get(treeNode.parent),result = 0;
                        while(parent){
                            result ++;
                            parent = $scope.cache.get(parent.parent);
                        }
                        return result;
                    }, setValue = function (treeNode) {
                        var treeNodeDom = $("#" + treeNode.id);
                        if (treeNodeDom.hasClass(checkTypes[0])) {
                            var level = getLevel(treeNode),values = result[level] || [];
                            values.push(treeNode);
                            result[level] = values;
                        } else {
                            angular.forEach(treeNode.children, function (value) {
                                setValue(value);
                            });
                        }
                    };
                    angular.forEach($scope.rootNodes, function (value) {
                        setValue(value);
                    });
                    $scope.$apply(function () {
                        $scope.value = result;
                    });
                    event.stopPropagation();
                },
                onClick = function (event) {
                    //关闭或者展开子节点
                    if ($(this).hasClass("closed")) {
                        $(this).removeClass("closed");
                        $(this).addClass("open");
                        var treeNode = $scope.cache.get($(this).attr("id"));
                        if ($scope.isLazyTree && treeNode.children.length == 0) {
                            //load data
                            treeNode.children = $scope.load(treeNode);
                            var html = [];
                            angular.forEach(treeNode.children,function(value){
                                value.parent = treeNode.id;
                                html.push(Handlebars.compile(treeNodeTemplate)(value));
                            });
                            $("#c-" + treeNode.id).html(html.join(""));
                            binding($("#c-" + treeNode.id));
                        }
                    } else {
                        $(this).addClass("closed");
                        $(this).removeClass("open");
                    }
                    //防止冒泡
                    event.stopPropagation();

                },
                onSelected = function () {
                    var treeNodeDom = $(this), treeNode = $scope.cache.get(treeNodeDom.attr("id"));
                    if (treeNodeDom.hasClass("selected")) {
                        treeNodeDom.removeClass("selected");
                    } else {
                        if ($scope.value) {
                            $("#" + $scope.value.id).removeClass("selected");
                        }
                        treeNodeDom.addClass("selected");
                        $scope.$apply(function () {
                            $scope.value = treeNode;
                        });
                        $scope.click(treeNode);
                    }

                };

            return {
                binding: binding
            }


        }
    }])
    .directive("tree", ["Handlebars", "$cacheFactory", "treeEventHandler", function (Handlebars, $cacheFactory, TreeEventHandler) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: "=",
                check: "=",
                click: "=",
                load: "=",
                value: "="
            },
            controller: function ($scope) {
                this.scope = $scope;
                $scope.cache = $cacheFactory($scope.$id + new Date().getTime);
            },
            link: function ($scope, element) {
                $scope.rootNodes = angular.isArray($scope.data) ? $scope.data : [$scope.data];
                $scope.isCheckboxTree = false;
                $.get("../templates/template-tree.html", function (treeTemplate) {
                    $.get("../templates/template-treeNode.html", function (template) {
                        Handlebars.registerPartial("treeNode", template);
                        Handlebars.registerHelper("isLeaf",function(treeNode,option){
                            if(treeNode.children){
                               return "";
                            }else{
                               return option.fn();
                            }
                        });
                        Handlebars.registerHelper("isFolder",function(treeNode,option){
                            if(treeNode.children){
                               return option.fn();
                            }else{
                               return "";
                            }
                        });
                        Handlebars.registerHelper("checkboxTree", function (treeNode, option) {
                            if ($scope.isCheckboxTree) {
                                return option.fn(treeNode);
                            } else {
                                return "";
                            }
                        });
                        Handlebars.registerHelper("blank", function (treeNode, option) {
                            $scope.cache.put(treeNode.id, treeNode);
                            var children = treeNode.children;
                            angular.forEach(children, function (child) {
                                child.parent = treeNode.id;
                            });
                            var parent = $scope.cache.get(treeNode.parent),result = [];
                            while (parent) {
                                result.push(option.fn());
                                parent = $scope.cache.get(parent.parent);
                            }
                            return result.join("");
                        });
                        element.html(Handlebars.compile(treeTemplate)({rootNodes: $scope.rootNodes}));

                        new TreeEventHandler($scope,template).binding($(element));
                    });
                });
            }
        };
    }])
    .directive("lazytree", function () {
        return {
            restrict: 'AE',
            require: '^tree',
            link: function ($scope, element, attrs, treeCtrl) {
                treeCtrl.scope.isLazyTree = true;
            }
        };
    })
    .directive("checkboxtree", function () {
        return {
            restrict: 'AE',
            require: '^tree',
            link: function ($scope, element, attrs, treeCtrl) {
                treeCtrl.scope.isCheckboxTree = true;
            }
        };
    })

   /*
    * container
    */
    .directive("vgroup",function($compile){
        return {
            restrict: "E",
            transclude: true,
            replace: true,
            link : function($scope,element,attrs,ctrl,transclude){
                var content = element.html();
                transclude(function (clone) {
                    $(element).empty();
                    angular.forEach(clone, function (value) {
                            if (value.nodeType != 3) {
                                $(element).append($(content).append(value));
                            }
                        }
                    );
                });
                $compile(element.contents())($scope);
            },
            templateUrl: "../templates/template-vgroup.html"
        };
    })
    .directive("hgroup",function($compile){
        return {
            restrict: "E",
            transclude: true,
            replace: true,
            link : function($scope,element,attrs,ctrl,transclude){
                var content = element.html();
                transclude(function (clone) {
                    $(element).empty();
                    angular.forEach(clone, function (value) {
                            if (value.nodeType != 3) {
                                $(element).append($(content).append(value));
                            }
                        }
                    );
                });
                $compile(element.contents())($scope);
            },
            templateUrl: "../templates/template-hgroup.html"
        };
    })
    .directive("gridlayout", function ($compile) {
        return {
            restrict: "E",
            transclude: true,
            link: function ($scope, element, attrs, ctrl, transclude) {
                var column = attrs.column ? Number(attrs.column) : 1;
                $(element).empty();
                transclude(function (clone) {
                    var number = 0,vGroup =  $("<VGroup></VGroup>") ,hGroup = $("<HGroup></HGroup>");
                    $(element).append(vGroup.append(hGroup));
                    angular.forEach(clone, function (value) {
                            if (value.nodeType != 3) {
                                if(number != 0 && (number % column == 0)){
                                    vGroup =  $("<VGroup></VGroup>") ;
                                    hGroup = $("<HGroup></HGroup>");
                                    $(element).append(vGroup.append(hGroup));
                                }
                                number ++;
                                hGroup.append(value);
                            }
                        }
                    );
                });
                $compile(element.contents())($scope);
            }
        };
    })
    /*
     * class directive
     */
    .directive("dropdown", function ($window) {
        return {
            restrict: 'C',
            link: function (scope, element) {
                var timer;
                element.click(function () {
                    var $this = $(this);
                    if (!$this.hasClass("open")) {
                        $this.addClass("open").focus();
                    }
                }).focusout(function () {
                    var _this = this;
                    timer = $window.setTimeout(function () {
                        var $this = $(this);
                        $this.removeClass("open");
                    }.bind(_this), 100);
                }).focusin(function () {
                    $window.clearTimeout(timer);
                });
            }
        };
    })
;