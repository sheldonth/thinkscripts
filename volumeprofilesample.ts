input pricePerRowHeightMode = {default AUTOMATIC, TICKSIZE, CUSTOM};
input customRowHeight = 1.0;
input timePerProfile = {default CHART, MINUTE, HOUR, DAY, WEEK, MONTH, "OPT EXP", BAR};
input multiplier = 1;

input profiles = 1000;
input showPointOfControl = yes;
input showValueArea = yes;
input valueAreaPercent = 70;
input opacity = 50;

input onExpansion = no;

def period;
def yyyymmdd = getYyyyMmDd();
def seconds = secondsFromTime(0);
def month = getYear() * 12 + getMonth();
def day_number = daysFromDate(first(yyyymmdd)) + getDayOfWeek(first(yyyymmdd));
def dom = getDayOfMonth(yyyymmdd);
def dow = getDayOfWeek(yyyymmdd - dom + 1);
def expthismonth = (if dow > 5 then 27 else 20) - dow;
def exp_opt = month + (dom > expthismonth);
switch (timePerProfile) {
case CHART:
    period = 0;
case MINUTE:
    period = floor(seconds / 60 + day_number * 24 * 60);
case HOUR:
    period = floor(seconds / 3600 + day_number * 24);
case DAY:
    period = countTradingDays(min(first(yyyymmdd), yyyymmdd), yyyymmdd) - 1;
case WEEK:
    period = floor(day_number / 7);
case MONTH:
    period = floor(month - first(month));
case "OPT EXP":
    period = exp_opt - first(exp_opt);
case BAR:
    period = barNumber() - 1;
}

def count = CompoundValue(1, if period != period[1] then (count[1] + period - period[1]) % multiplier else count[1], 0);
def cond = count < count[1] + period - period[1];
def height;
switch (pricePerRowHeightMode) {
case AUTOMATIC:
    height = PricePerRow.AUTOMATIC;
case TICKSIZE:
    height = PricePerRow.TICKSIZE;
case CUSTOM:
    height = customRowHeight;
}

profile vol = volumeProfile("startNewProfile" = cond, "onExpansion" = onExpansion, "numberOfProfiles" = profiles, "pricePerRow" = height, "value area percent" = valueAreaPercent);
def con = compoundValue(1, onExpansion, no);
def pc = if IsNaN(vol.getPointOfControl()) and con then pc[1] else vol.getPointOfControl();
def hVA = if IsNaN(vol.getHighestValueArea()) and con then hVA[1] else vol.getHighestValueArea();
def lVA = if IsNaN(vol.getLowestValueArea()) and con then lVA[1] else vol.getLowestValueArea();

def hProfile = if IsNaN(vol.getHighest()) and con then hProfile[1] else vol.getHighest();
def lProfile = if IsNaN(vol.getLowest()) and con then lProfile[1] else vol.getLowest();
def plotsDomain = IsNaN(close) == onExpansion;

plot POC = if plotsDomain then pc else Double.NaN;
plot ProfileHigh = if plotsDomain then hProfile else Double.NaN;
plot ProfileLow = if plotsDomain then lProfile else Double.NaN;
plot VAHigh = if plotsDomain then hVA else Double.NaN;
plot VALow = if plotsDomain then lVA else Double.NaN;

DefineGlobalColor("Profile", GetColor(1));
DefineGlobalColor("Point Of Control", GetColor(5));
DefineGlobalColor("Value Area", GetColor(8));

vol.show(globalColor("Profile"), if showPointOfControl then globalColor("Point Of Control") else color.current, if showValueArea then globalColor("Value Area") else color.current, opacity);
POC.SetDefaultColor(globalColor("Point Of Control"));
POC.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
VAHigh.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
VALow.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
VAHigh.SetDefaultColor(globalColor("Value Area"));
VALow.SetDefaultColor(globalColor("Value Area"));
ProfileHigh.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
ProfileLow.SetPaintingStrategy(PaintingStrategy.HORIZONTAL);
ProfileHigh.SetDefaultColor(GetColor(3));
ProfileLow.SetDefaultColor(GetColor(3));
ProfileHigh.hide();
ProfileLow.hide();