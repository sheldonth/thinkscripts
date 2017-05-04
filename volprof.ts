#input pricePerRowHeightMode = {default AUTOMATIC, TICKSIZE, CUSTOM};
#input customRowHeight = 1.0;
#input timePerProfile = {default CHART, MINUTE, HOUR, DAY, WEEK, MONTH, "OPT EXP", BAR};
def multiplier = 1;
def profiles = 1000;
def showPointOfControl = yes;
def showValueArea = yes;
input valueAreaPercent = 70;
def opacity = 40;
def onExpansion = no;
#def period;
def yyyymmdd = getYyyyMmDd(); #20170504
def seconds = secondsFromTime(0); # Number of seconds until midnight?
def month = getYear() * 12 + getMonth();
def day_number = daysFromDate(first(yyyymmdd)) + getDayOfWeek(first(yyyymmdd));
def dom = getDayOfMonth(yyyymmdd);
def dow = getDayOfWeek(yyyymmdd - dom + 1);
def expthismonth = (if dow > 5 then 27 else 20) - dow;
def exp_opt = month + (dom > expthismonth);
def opentime=0930;
def closetime=1600;
def AP = getAggregationPeriod();
def daily=if AP>=aggregationPeriod.DAY then 1 else 0;
def isopen=if daily then 1 else if secondsFromTime(opentime)>=0 and secondstillTime(closetime)>=0 then 1 else 0;

# 1m = hourly webs
# 5m = daily webs
# 1h = weekly webs
# 1d = monthly webs
# 1w = yearly webs

#Any Tick Chart = 0
#1 min = 60,000
#2 min = 120,000
#3 min = 180,000
#4 min = 240,000
#5 min = 300,000
#10 min = 600,000
#15 min = 900,000
#20 min = 1,200,000
#30 min = 1,800,000
#1 hr = 3,600,000
#2 hr = 7,200,000
#4 hr = 14,400,000
#Daily = 86,400,000
#Weekly = 604,800,000
#Monthly = 2,592,000,000
def period_alt;
if AP <= 60000 { # 1 Minute, Hourly webs
    period_alt = floor(seconds / 3600 + day_number * 24);
} else {
    if AP <= 300000 { # 5 Minute, Daily Webs
        period_alt = countTradingDays(min(first(yyyymmdd), yyyymmdd), yyyymmdd) - 1;
    } else {
        if AP <= 3600000 { # 1h, Weekly Webs
            period_alt = floor(day_number / 7);
        } else {
            if AP <= 86400000 { # 1d, Monthly Webs
                period_alt = floor(month - first(month));
            } else {
                period_alt = 0;
            }
        }
    }
}

AddLabel(AP <= 60000, "Hourly Webs", Color.GREEN);
AddLabel(AP <= 300000 and AP > 60000, "Daily Webs", Color.GREEN);
AddLabel(AP <= 3600000 and AP > 300000, "Weekly Webs", Color.GREEN);
AddLabel(AP <= 86400000 and AP > 3600000, "Monthly Webs", Color.GREEN);

#switch (timePerProfile) {
#case CHART:
#    period = 0;
#case MINUTE:
#    period = floor(seconds / 60 + day_number * 24 * 60);
#case HOUR:
#    period = floor(seconds / 3600 + day_number * 24);
#case DAY:
#    period = countTradingDays(min(first(yyyymmdd), yyyymmdd), yyyymmdd) - 1;
#case WEEK:
#    period = floor(day_number / 7);
#case MONTH:
#    period = floor(month - first(month));
#case "OPT EXP":
#    period = exp_opt - first(exp_opt);
#case BAR:
#    period = barNumber() - 1;
#}
def period = period_alt;
def count = CompoundValue(1, if period != period[1] then (count[1] + period - period[1]) % multiplier else count[1], 0);
def cond = count < count[1] + period - period[1];
def height = PricePerRow.AUTOMATIC;
#switch (pricePerRowHeightMode) {
#case AUTOMATIC:
#    height = PricePerRow.AUTOMATIC;
#case TICKSIZE:
#    height = PricePerRow.TICKSIZE;
#case CUSTOM:
#    height = customRowHeight;
#}

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

DefineGlobalColor("Profile", CreateColor(0, 92, 127));
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