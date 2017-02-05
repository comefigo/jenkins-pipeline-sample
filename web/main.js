function MySample() {
    this.num = 0;
}

MySample.prototype.plus = function() {
    return this.num++;
};

MySample.prototype.minus = function() {
    return this.minus--;
};