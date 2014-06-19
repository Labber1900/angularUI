/**
 * Created by obladi on 14-6-18.
 */
(function(){
    if (!Function.prototype.bind) {
        Function.prototype.bind = function(oThis) {
            if (typeof this !== "function") {
                throw new TypeError(
                    "Function.prototype.bind - what is trying to be bound is not callable");
            }
            var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function() {
            }, fBound = function() {
                return fToBind.apply(this instanceof fNOP && oThis ? this
                    : oThis || window, aArgs.concat(Array.prototype.slice
                    .call(arguments)));
            };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

    Array.prototype.displace = function(from, to) {
        if (from < to) {
            return [].concat(this.slice(0, from), this.slice(from + 1, to + 1),
                this[from], this.slice(to + 1));
        } else {
            return [].concat(this.slice(0, to), this[from], this
                .slice(to, from), this.slice(from + 1));
        }

    };
    Array.prototype.addTo = function(data, to) {
        if (to > 0) {
            var _data = [].concat(this.slice(0, to), data, this.slice(to)), length = this.length;
            this.splice.apply(this, [ 0, length ].concat(_data));
        } else {
            if (to == 0 && this.length == 0) {
                this.push(data);
            } else {
                this.unshift(data);
            }
        }
    };
    Array.prototype.indexOf = function(data,filter) {
        var result = -1, i = 0, length = this.length,item = null;
        for (; i < length; i++) {
            item = this[i];
            if((filter && filter.apply(this,[i,data])) || (data == item)){
                result = i;
                break;
            }
        }
        return result;
    };
    Array.prototype.remove = function(from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };
})();