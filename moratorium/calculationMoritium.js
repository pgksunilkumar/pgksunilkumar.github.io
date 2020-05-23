self.addEventListener("message", function(e) {
    var data = e.data;
    var moritoriumCalResult = getcalcMoritoriumResult(data.roi, data.loanTenure, data.emiPaid, data.loanAmt, data.moratoruimPeriod, data.threshold);
    self.postMessage(moritoriumCalResult);
});

var getcalcMoritoriumResult = function(roi, loanTenure, emiPaid, loanAmount, defermentPeriod, threshold) {
    var noOfDays = 30;
    threshold = threshold ? threshold : 500;
    defermentPeriod = defermentPeriod ? defermentPeriod : 3;

    var calculate = function(outstanding, isRevised, tenureOrEmi) {
        var count = 0;
        var newOutstanding = outstanding;
        var accuredInterest = 0;
        var interestTable = [];
        while (newOutstanding > 0) {
            if (count > threshold) {
                return null;
            }
            var customerOutstanding = interestRampDown(newOutstanding, isRevised, tenureOrEmi, count);
            accuredInterest += customerOutstanding.interest;
            interestTable.push(customerOutstanding);
            newOutstanding = customerOutstanding.newOutstanding;
            count++;
        }

        return {
            accuredInterest: accuredInterest,
            interestTable: interestTable,
        };
    };

    var interestRampDown = function(outstanding, isRevised, tenureOrEmi, count) {
        var interest = Math.round((roi * outstanding * noOfDays) / 360);
        var emi;
        if (isRevised) {
            emi = tenureOrEmi;
        } else {
            var tenure = tenureOrEmi;
            emi = Math.round(PMT(roi / 12, tenure - count, outstanding));
        }
        var principal = emi - interest;
        var newOutstanding = outstanding - principal;
        return {
            count: count,
            interest: interest,
            principal: principal,
            emi: emi,
            newOutstanding: newOutstanding,
        };
    };

    var calculateMoritorium = function(outstanding) {
        var interest = Math.round((roi * outstanding * noOfDays) / 360);
        return interest * defermentPeriod;
    };

    function PMT(ir, np, pv, fv, type) {
        var pmt, pvif;

        fv || (fv = 0);
        type || (type = 0);

        if (ir === 0) return -(pv + fv) / np;

        pvif = Math.pow(1 + ir, np);
        pmt = (-ir * pv * (pvif + fv)) / (pvif - 1);

        if (type === 1) pmt /= 1 + ir;

        return pmt * -1;
    }

    var originalRepaymentSchedule = calculate(loanAmount, false, loanTenure);
    if (originalRepaymentSchedule === null) {
        return null;
    }

    var outstandingForMoritorium = originalRepaymentSchedule.interestTable[emiPaid - 1].newOutstanding;
    var calculatedMoritoriumInterest = calculateMoritorium(outstandingForMoritorium);
    var outstandingWithMoritoriumInterest = outstandingForMoritorium + calculatedMoritoriumInterest;
    var emi = originalRepaymentSchedule.interestTable[0].emi;

    var newEMI = PMT(roi / 12, loanTenure - emiPaid, outstandingWithMoritoriumInterest);

    var revisedRepaymentSchedule = calculate(outstandingWithMoritoriumInterest, true, emi);
    if (revisedRepaymentSchedule === null) {
        return null;
    }

    var noOfExtraEmiPaid = revisedRepaymentSchedule.interestTable.length + emiPaid - originalRepaymentSchedule.interestTable.length;

    var originalAccuredInterest = originalRepaymentSchedule.accuredInterest;
    var originalInterestTable = originalRepaymentSchedule.interestTable;
    var originalRepaymentTenure = originalInterestTable.length;
    var originalBalanceTenure = originalRepaymentTenure - emiPaid;

    var revisedAccuredInterest = revisedRepaymentSchedule.accuredInterest + calculatedMoritoriumInterest;
    var revisedInterestTable = revisedRepaymentSchedule.interestTable;
    var revisedRepaymentTenure = revisedRepaymentSchedule.interestTable.length + defermentPeriod;
    var revisedBalanceTenure = revisedRepaymentSchedule.interestTable.length;

    var differenceOfInterestWithoutMoritorium = revisedRepaymentSchedule.accuredInterest - originalRepaymentSchedule.accuredInterest;
    var actualDifferenceOfInterestWithMoritorium = revisedAccuredInterest - originalAccuredInterest;

    var output = {
        defermentInterest: calculatedMoritoriumInterest,
        newPrincipalOutstanding: outstandingWithMoritoriumInterest,
        emiIfLoanTenureIncreases: emi,
        emiIfLoanTenureRemainsSame: Math.round(newEMI),
        revisedBalanceTenureInMonths: revisedBalanceTenure,
        originalBalanceTenureInMonths: originalBalanceTenure,
    };

    var options = {
        option1: {
            extraEmi: noOfExtraEmiPaid,
            financialImpact: emi * noOfExtraEmiPaid,
        },
        option2: {
            extraEmi: 0,
            financialImpact: calculatedMoritoriumInterest,
        },
        option3: {
            extraEmi: 0,
            financialImpact: Math.round(calculatedMoritoriumInterest * Math.pow(1 + roi, originalBalanceTenure / 12)),
        },
        option4: {
            extraEmi: Math.round(newEMI - emi),
            financialImpact: Math.round(Math.round(newEMI - emi) * originalBalanceTenure),
        },
    };

    return {
        originalRepaymentSchedule: originalRepaymentSchedule,
        revisedRepaymentSchedule: revisedRepaymentSchedule,
        calculatedMoritoriumInterest: calculatedMoritoriumInterest,
        originalAccuredInterest: originalAccuredInterest,
        originalInterestTable: originalInterestTable,
        originalRepaymentTenure: originalRepaymentTenure,
        revisedAccuredInterest: revisedAccuredInterest,
        revisedInterestTable: revisedInterestTable,
        revisedRepaymentTenure: revisedRepaymentTenure,
        differenceOfInterestWithoutMoritorium: differenceOfInterestWithoutMoritorium,
        actualDifferenceOfInterestWithMoritorium: actualDifferenceOfInterestWithMoritorium,
        output: output,
        options: options,
    };
};