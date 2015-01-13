/**
 * Created by obladi on 14-6-5.
 */
define(["angular", "jquery", "Handlebars"], function (angular, $, Handlebars) {
    angular.module("com.uniparticle", [])
        .factory("Handlebars", function () {
            return Handlebars;
        })
        .factory("Class", function () {
            var initializing = false, fnTest = /xyz/.test(function () {
                xyz;
            }) ? /\b_super\b/ : /.*/;
            var Class = function () {
            };
            Class.extend = function (prop) {
                var _super = this.prototype;
                initializing = true;
                var prototype = new this();
                initializing = false;
                for (var name in prop) {
                    prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function (name, fn) {
                        return function () {
                            var tmp = this._super;
                            this._super = _super[name];
                            var ret = fn.apply(this, arguments);
                            this._super = tmp;

                            return ret;
                        };
                    })(name, prop[name]) : prop[name];
                }

                function Class() {
                    if (!initializing && this.init) {
                        this.init.apply(this, arguments);
                        if (this.ready) {
                            this.ready.apply(this);
                        }
                    }
                }

                Class.prototype = prototype;
                Class.prototype._constructor = Class;
                Class.extend = arguments.callee;
                return Class;
            };
            return Class;
        })
        .factory("InputFieldFactory", ["Class", function (Class) {
            //TODO:需要为text增加disable属性
            var BaseInputField = Class.extend({
                init: function () {
                    this.restrict = "E";
                    this.replace = true;
                    this.scope = {
                        value: "=",
                        default: "="
                    };
                    this.require = "^form";
                    var compileFn = this._compile, linkFn = this._link;
                    this.compile = function (element, attrs) {
                        compileFn(element, attrs);
                        return function ($scope, element, attrs, formCtrl) {
                            linkFn($scope, element, attrs, formCtrl);
                        }
                    };
                },
                _link: function ($scope, element, attrs, formCtrl) {
                    $scope.placeholder = attrs.hasOwnProperty("placeholder") ? attrs.placeholder : "";
                    $scope.field = formCtrl[attrs.name];
                    $scope.required = attrs.hasOwnProperty("required") ? true : false;
                    var resetValue = function () {
                        if ($scope.default && ($scope.value == null || $scope.value == undefined || $scope.value.length == 0)) {
                            $scope.value = $scope.default;
                        }
                    };
                    //input 失去焦点后，填充default value
                    $(element).find("input").blur(function () {
                        $scope.$apply(resetValue);
                    });
                    resetValue();
                },
                _compile: function (element, attrs) {
                    var inputObj = $(element).find("input");
                    if (attrs.name)
                        inputObj.attr("name", attrs.name);
                    else
                        console.error("必须制定name！");
                    return inputObj;
                }
            });
            var Text = BaseInputField.extend({
                init: function () {
                    this._super();
                    this.templateUrl = "../templates/template-text.html";
                },
                _link: function ($scope, element, attrs, formCtrl) {
                    this._super($scope, element, attrs, formCtrl);
                    var min = attrs.hasOwnProperty("minlength") ? parseInt(attrs.minlength) : -1, max = attrs.hasOwnProperty("maxlength") ? parseInt(attrs.maxlength) : -1;
                    $scope.minlength = min;
                    $scope.maxlength = max;
                },
                _compile: function (element, attrs) {
                    var inputObj = this._super(element, attrs);
                    var min = attrs.hasOwnProperty("minlength") ? parseInt(attrs.minlength) : -1, max = attrs.hasOwnProperty("maxlength") ? parseInt(attrs.maxlength) : -1;
                    if (min >= 0)
                        inputObj.attr("ng-minlength", min);
                    if (max >= 0)
                        inputObj.attr("ng-maxlength", max);
                }
            });
            var Password = Text.extend({
                init: function () {
                    this._super();
                    this.templateUrl = "../templates/template-password.html";
                }
            });
            var Number = BaseInputField.extend({
                init: function () {
                    this._super();
                    this.templateUrl = "../templates/template-number.html";
                },
                _link: function ($scope, element, attrs, formCtrl) {
                    this._super($scope, element, attrs, formCtrl);
                    var min = attrs.hasOwnProperty("min") ? parseInt(attrs.min) : NaN, max = attrs.hasOwnProperty("max") ? parseInt(attrs.max) : NaN;
                    $scope.min = min;
                    $scope.max = max;
                    if (attrs.hasOwnProperty("fractionsize") && !attrs.hasOwnProperty("integer")) {
                        if (attrs.fractionsize.length == 0) {
                            $scope.fractionSize = 2;
                        } else {
                            $scope.fractionSize = parseInt(attrs.fractionsize);
                        }
                    } else {
                        $scope.fractionSize = 0;
                    }
                },
                _compile: function (element, attrs) {
                    var inputObj = this._super(element, attrs);
                    var min = attrs.hasOwnProperty("min") ? parseInt(attrs.min) : NaN, max = attrs.hasOwnProperty("max") ? parseInt(attrs.max) : NaN;
                    if (angular.isNumber(min))
                        inputObj.attr("min", min);
                    if (angular.isNumber(max))
                        inputObj.attr("max", max);
                    if (attrs.hasOwnProperty("integer")) {
                        inputObj.attr("isinteger", "");
                    } else {
                        inputObj.attr("isfloat", "");
                    }
                }
            });
            var Email = BaseInputField.extend({
                init: function () {
                    this._super();
                    this.templateUrl = "../templates/template-email.html";
                },
                _link: function ($scope, element, attrs, formCtrl) {
                    this._super($scope, element, attrs, formCtrl);
                },
                _compile: function (element, attrs) {
                    this._super(element, attrs);
                }
            });
            var Money = Number.extend({
                init: function () {
                    this._super();
                    this.templateUrl = "../templates/template-money.html";
                },
                _link: function ($scope, element, attrs, formCtrl) {
                    this._super($scope, element, attrs, formCtrl);
                    $scope.symbol = attrs.symbol ? attrs.symbol : "";
                },
                _compile: function (element, attrs) {
                    this._super(element, attrs);
                }
            });
            return {
                "text": Text,
                "number": Number,
                "email": Email,
                "money": Money,
                "password": Password
            };
        }])
        .factory("treeEventHandler", ["constant", "Handlebars", function (constant, Handlebars) {
            return function ($scope, treeNodeTemplate) {
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
                        var result = [], getLevel = function (treeNode) {
                            var parent = $scope.cache.get(treeNode.parent), result = 0;
                            while (parent) {
                                result++;
                                parent = $scope.cache.get(parent.parent);
                            }
                            return result;
                        }, setValue = function (treeNode) {
                            var treeNodeDom = $("#" + treeNode.id);
                            if (treeNodeDom.hasClass(checkTypes[0])) {
                                var level = getLevel(treeNode), values = result[level] || [];
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
                                angular.forEach(treeNode.children, function (value) {
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
                number: {
                    regexp: {
                        integer: /^\-?\d+$/,
                        float: /^\-?\d+((\.|\,)\d+)?$/
                    }
                },
                email: {
                    regexp: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
                },
                date: {
                    defaultFormat: "yyyy-MM-dd",
                    editorFormat: "yyyyMMdd",
                    regexps: {
                        8: /^(\d{4})(\d{2})(\d{2})$/,
                        7: [/^(\d{4})(\d{2})(\d{1})$/, /^(\d{4})(\d{1})(\d{2})$/],
                        6: /^(\d{4})(\d{1})(\d{1})$/
                    },
                    replace: "$1/$2/$3"
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
     * 文本输入域
     * @attribute
     *   name string
     *   value binding
     *   default binding
     *   placeholder string
     *   maxlength number
     *   minlength number
     *   @declare
     *   required
     */
        .directive("text", ["InputFieldFactory", function (InputFieldFactory) {
            return new InputFieldFactory["text"]();
        }])
    /**
     * 密码输入域
     * @extends TextField
     * @attribute
     *   name string
     *   value binding
     *   default binding
     *   placeholder string
     *   maxlength number
     *   minlength number
     *   @declare
     *   required
     */
        .directive("password", ["InputFieldFactory", function (InputFieldFactory) {
            return new InputFieldFactory["password"]();
        }])
    /**
     * email输入域
     * @extends TextField
     * @attribute
     *   name string
     *   value binding
     *   default binding
     *   placeholder string
     *  @declare
     *   required
     *
     */
        .directive("email", ["InputFieldFactory", function (InputFieldFactory) {
            return new InputFieldFactory["email"]();
        }])
        .directive('isinteger', ["constant", function (constant) {
            return {
                require: 'ngModel',
                restrict: 'A',
                link: function (scope, elm, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (viewValue) {
                        if (constant.get("number.regexp.integer").test(viewValue)) {
                            // it is valid
                            ctrl.$setValidity('integer', true);
                            return viewValue;
                        } else {
                            if (viewValue && viewValue.length > 0) {
                                ctrl.$setValidity('integer', false);
                            } else {
                                ctrl.$setValidity('integer', true);
                            }
                            return undefined;
                        }
                    });
                }
            };
        }])
        .directive('isfloat', ["constant", function (constant) {
            return {
                require: 'ngModel',
                restrict: 'A',
                link: function (scope, elm, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (viewValue) {
                        if (constant.get("number.regexp.float").test(viewValue)) {
                            ctrl.$setValidity('float', true);
                            return parseFloat(viewValue.replace(',', '.'));
                        } else {
                            if (viewValue && viewValue.length > 0) {
                                ctrl.$setValidity('float', false);
                            } else {
                                ctrl.$setValidity('float', true);
                            }
                            return undefined;
                        }
                    });
                }
            };
        }])
        .directive('isemail', ["constant", function (constant) {
            return {
                require: 'ngModel',
                restrict: 'A',
                link: function (scope, elm, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (viewValue) {
                        if (constant.get("email.regexp").test(viewValue)) {
                            ctrl.$setValidity('email', true);
                            return viewValue;
                        } else {
                            if (viewValue && viewValue.length > 0) {
                                ctrl.$setValidity('email', false);
                            } else {
                                ctrl.$setValidity('email', true);
                            }
                            return undefined;
                        }
                    });
                }
            };
        }])
    /**
     * 数字输入域
     * @extends TextField
     * @attribute
     *   name string
     *   value binding
     *   default binding
     *   placeholder string
     *   min number
     *   max number
     *   fractionSize number
     * @declare
     *   integer number type
     *   float (default)
     *   required
     */
        .directive("number", ["InputFieldFactory", function (InputFieldFactory) {
            return new InputFieldFactory["number"]();
        }])
    /**
     * 金额输入域
     * extends NumberField
     * @attribute
     *
     */
        .directive("money", ["InputFieldFactory", function (InputFieldFactory) {
            return new InputFieldFactory["money"]();
        }])
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
        .factory("dateUtil", ["constant", function (constant) {
            return {
                parseDate: function (value) {
                    var regexps = constant.get("date.regexps"), result = null;
                    if (value.length < 9 && value.length > 5) {
                        switch (value.length) {
                            case 6 :
                            {
                                if (regexps[6].test(value)) {
                                    result = new Date(value.replace(regexps[6], constant.get("date.replace")));
                                    break;
                                }
                            }
                                ;
                                break;
                            case 7 :
                            {
                                var array = regexps[7], length = array.length;
                                for (var i = 0; i < length; i++) {
                                    if (array[i].test(value)) {
                                        result = new Date(value.replace(array[i], constant.get("date.replace")));
                                        break;
                                    }
                                }
                            }
                                ;
                                break;
                            case 8:
                            {
                                if (regexps[8].test(value)) {
                                    result = new Date(value.replace(regexps[8], constant.get("date.replace")));
                                    break;
                                }
                            }
                                ;
                                break;
                        }
                    }
                    if (!angular.isDate(result)) {
                        result = null;
                    }
                    return result;
                }
            };
        }])
        .directive("date", ["$filter", "constant", "dateUtil", function ($filter, constant, DateUtil) {
            return {
                require: ["^form", "?calendar"],
                restrict: 'E',
                scope: {
                    value: '='
                },
                compile: function (element, attrs) {
                    var inputObj = $(element).find("input");
                    if (attrs.name)
                        inputObj.attr("name", attrs.name);
                    else
                        console.error("必须制定name！");
                    return function ($scope, element, attrs, ctrls) {
                        $scope.format = attrs.format ? attrs.format : constant.get("date.defaultFormat");
                        $scope.field = ctrls[0][attrs.name];
                        $scope.required = attrs.hasOwnProperty("required");
                        $scope.$watch("value", function (value) {
                            $scope.displayValue = $filter("date")(value, $scope.format);
                        });
                        $(element).find("input").click(function (event) {
                            event.stopPropagation();
                        }).focus(function () {
                            $scope.$apply(function () {
                                $scope.displayValue = $filter("date")($scope.value, constant.get("date.editorFormat"));
                            });
                        }).blur(function () {
                            var _value = this.value;
                            $scope.$apply(function () {
                                $scope.value = DateUtil.parseDate(_value);
                            });
                        });

                    };
                },
                templateUrl: '../templates/template-date.html'
            };
        }])
        .directive("isdate", ["dateUtil", function (DateUtil) {
            return {
                require: "^ngModel",
                restrict: 'A',
                link: function ($scope, element, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (viewValue) {
                        if (DateUtil.parseDate(viewValue)) {
                            ctrl.$setValidity('date', true);
                            return viewValue;
                        } else {
                            ctrl.$setValidity('date', false);
                            return viewValue;
                        }
                    });
                }
            };
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
                            Handlebars.registerHelper("isLeaf", function (treeNode, option) {
                                if (treeNode.children) {
                                    return "";
                                } else {
                                    return option.fn();
                                }
                            });
                            Handlebars.registerHelper("isFolder", function (treeNode, option) {
                                if (treeNode.children) {
                                    return option.fn();
                                } else {
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
                                var parent = $scope.cache.get(treeNode.parent), result = [];
                                while (parent) {
                                    result.push(option.fn());
                                    parent = $scope.cache.get(parent.parent);
                                }
                                return result.join("");
                            });
                            element.html(Handlebars.compile(treeTemplate)({rootNodes: $scope.rootNodes}));

                            new TreeEventHandler($scope, template).binding($(element));
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
        .directive("checkbox", function () {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    value: "=",
                    data: "="
                },
                link: function ($scope, element, attrs) {
                    if (!$scope.value) {
                        $scope.value = [];
                    }
                    var inline = 0;
                    //inline属性可以设置为 inline or inline="4" 数字为每行得列数
                    if (attrs.hasOwnProperty("inline")) {
                        inline = parseInt(attrs.inline);
                        if (!inline) {
                            inline = -1;//不换行
                        }
                    }
                    $scope.name = attrs.name;
                    $scope.inline = inline;
                    $scope.onCheck = function (item) {
                        var index = $scope.value.indexOf(item);
                        if (index == -1) {
                            $scope.value.push(item);
                        } else {
                            $scope.value.remove(index);
                        }
                    };
                },
                templateUrl: "../templates/template-checkbox.html"
            }
        })
        .directive("radio", function () {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    value: "=",
                    data: "="
                },
                link: function ($scope, element, attrs) {
                    if (!$scope.value) {
                        $scope.value = [];
                    }
                    var inline = 0;
                    //inline属性可以设置为 inline or inline="4" 数字为每行得列数
                    if (attrs.hasOwnProperty("inline")) {
                        inline = parseInt(attrs.inline);
                        if (!inline) {
                            inline = -1;//不换行
                        }
                    }
                    $scope.name = attrs.name;
                    $scope.inline = inline;
                    $scope.onCheck = function (item) {
                        $scope.value = item;
                    };
                },
                templateUrl: "../templates/template-radio.html"
            }
        })
        .directive("combobox", function () {
            return {
                restrict: "E",
                replace: "true",
                require: ["^form", "?list"],
                scope: {
                    data: "=",
                    value: "="
                },
                compile: function (element, attrs) {
                    var inputObj = $(element).find("input");
                    if (attrs.name)
                        inputObj.attr("name", attrs.name);
                    else
                        console.error("必须制定name！");
                    return function ($scope, element, attrs, ctrl) {
                        $scope.field = ctrl[0][attrs.name];
                        $scope.required = attrs.hasOwnProperty("required") ? true : false;
                    };
                },
                templateUrl: "../templates/template-combobox.html"
            };
        })
        .directive("formbutton", function () {
            return {
                restrict: "A",
                require: "^form",
                link: function ($scope, element, attrs, formCtrl) {
                    $scope.$watch(function () {
                        return formCtrl.$invalid;
                    }, function (value) {
                        if (value) {
                            $(element).attr("disabled", "disabled");
                        } else {
                            $(element).removeAttr("disabled");
                        }
                    });
                }
            };
        })
        .directive("smartfloat", function () {
            return {
                restrict: "A",
                link: function ($scope, element) {
                    var top = $(element).position().top, pos = $(element).css("position");
                    $(window).scroll(function () {
                        var scrolls = $(this).scrollTop();
                        if (scrolls > top) {
                            if (window.XMLHttpRequest) {
                                $(element).css({
                                    position: "fixed",
                                    top: 0
                                });
                            } else {
                                $(element).css({
                                    top: scrolls
                                });
                            }
                        } else {
                            $(element).css({
                                position: pos,
                                top: top
                            });
                        }
                    });
                }
            };
        })
        /*
         * container
         */
        .directive("vgroup", function ($compile) {
            return {
                restrict: "E",
                transclude: true,
                replace: true,
                link: function ($scope, element, attrs, ctrl, transclude) {
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
        .directive("hgroup", function ($compile) {
            return {
                restrict: "E",
                transclude: true,
                replace: true,
                link: function ($scope, element, attrs, ctrl, transclude) {
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
        .directive("list", function () {
            return {
                restrict: "E",
                replace: true,
                scope: {
                    data: "=",
                    value: "="
                },
                link: function ($scope) {
                    $scope.clickHandler = function (item) {
                        $scope.value = item;
                    };
                },
                templateUrl: "../templates/template-list.html"
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
                        var number = 0, vGroup = $("<VGroup></VGroup>") , hGroup = $("<HGroup></HGroup>");
                        $(element).append(vGroup.append(hGroup));
                        angular.forEach(clone, function (value) {
                                if (value.nodeType != 3) {
                                    if (number != 0 && (number % column == 0)) {
                                        vGroup = $("<VGroup></VGroup>");
                                        hGroup = $("<HGroup></HGroup>");
                                        $(element).append(vGroup.append(hGroup));
                                    }
                                    number++;
                                    hGroup.append(value);
                                }
                            }
                        );
                    });
                    $compile(element.contents())($scope);
                }
            };
        })
        .directive("datagrid", function () {
            return {
                restrict: 'E',
                transclude: true,
                replace: true,
                controller: function () {
                    var headerIndex = [];
                    this.headers = [];
                    this.columns = [];
                    this.colspan = {};
                    this.rowspan = {};
                    this.max = 0;
                    this.addCell = function (cell) {
                        this.columns.push(cell);
                        var title = cell.title, titles = title.split("."), length = titles.length, header = null , level = 0;
                        this.max = length > this.max ? length : this.max;
                        //init header,parse title,解析上下级关系
                        while (titles.length) {
                            header = titles.shift();
                            this.colspan[header] = this.colspan.hasOwnProperty(header) ? this.colspan[header] + 1 : 1;
                            this.rowspan[header] = level + 1 < length ? 1 : -level;
                            if (this.headers[level] == null) {
                                this.headers[level] = [];
                            }
                            var th = this.headers[level];
                            if (!headerIndex[header]) {
                                th.push({
                                    text: header

                                });
                                headerIndex[header] = th[th.length - 1];
                            }
                            level++;
                        }
                    };

                },
                link: function ($scope, element, attrs, ctrl) {
                    for (var i = 0; i < ctrl.headers.length; i++) {
                        var th = ctrl.headers[i];
                        for (var j = 0; j < th.length; j++) {
                            var header = th[j];
                            header.colspan = ctrl.colspan[header.text];
                            header.rowspan = ctrl.rowspan[header.text] > 0 ? ctrl.rowspan[header.text] : ctrl.max + ctrl.rowspan[header.text];
                        }
                    }
                    $scope.headers = ctrl.headers;
                },
                templateUrl: "../templates/template-datagrid.html"
            };
        })
        .directive("cell", function () {
            return {
                require: '^datagrid',
                restrict: 'E',
                replace: true,
                transclude: true,
                link: function ($scope, element, attrs, ctrl) {
                    ctrl.addCell({
                        field: attrs.field,
                        title: attrs.title,
                        fixed: attrs.hasOwnProperty("fixed"),
                        align: attrs.align ? attrs.align : "center"
                    });
                },
                templateUrl: '../templates/template-cell.html'
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
                    $(element).click(function () {
                        var $this = $(this);
                        if (!$this.hasClass("opened")) {
                            $this.addClass("opened").focus();
                        }
                    }).focusout(function () {
                        var _this = this;
                        timer = $window.setTimeout(function () {
                            var $this = $(this);
                            $this.removeClass("opened");
                        }.bind(_this), 100);
                    }).focusin(function () {
                        $window.clearTimeout(timer);
                    });
                }
            };
        });
});