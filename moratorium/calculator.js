const calcProgramURL = 'calculationMoritium.js';

var calculateMoritoriumResult = function(roi, loanTenure, emiPaid, loanAmt, moratoruimPeriod, threshold) {
    return new Promise(function(resolve, reject) {
        var calculateVal = {
            "roi": roi,
            "loanTenure": loanTenure,
            "emiPaid": emiPaid,
            "loanAmt": loanAmt,
            "moratoruimPeriod": moratoruimPeriod,
            "threshold": threshold
        };
        try {
            var calcProgram = new Worker(calcProgramURL);
            calcProgram.postMessage(calculateVal);
            calcProgram.addEventListener('message', function(e) {
                if (e && e.data && (typeof(e.data) === "object")) {
                    resolve(e.data);
                } else {
                    reject("Invalid Data Entered");
                }
                calcProgram.terminate();
            });
        } catch (e) {
            reject(e);
        }

    });
}

function getIndianFormat(str) {
    str = str.toString().split(".");
    return str[0].replace(/(\d)(?=(\d\d)+\d$)/g, "$1,") + (str[1] ? ("." + str[1]) : "");
}

function openCalculation(event) {
    var inputValue = event.target.value;
    if (inputValue === '') {

        var currentLoanEmiTd = document.querySelectorAll('td[data-id="currentEmi"]');
        currentLoanEmiTd.forEach(tdEle => {
            tdEle.innerHTML = "0.00";
        });

        var originalBalTenureTd = document.querySelectorAll('td[data-id="originalBalTd"]');
        originalBalTenureTd.forEach(function(tdEle) {
            tdEle.innerHTML = '0.00';
        });

        document.getElementById('revisedTenure').innerHTML = '0.00';
        document.getElementById('extraEmiPaid').innerHTML = '0.00';

        var financialImpactTd = document.querySelectorAll('td[data-id="financialImpactTd"]');
        financialImpactTd.forEach(function(tdEle, index) {
            tdEle.innerHTML = '0.00';
        });

        document.getElementById('revisedLoanEmi').innerHTML = '0.00';
        document.getElementById('increaseEmiInMonths').innerHTML = '0.00';

        document.getElementById('defermentIntrestTd').innerHTML = '0.00';
        document.getElementById('newPrincipalOsTd').innerHTML = '0.00';
        document.getElementById('emiLoanIncreasTd').innerHTML = '0.00'; //currentLoanEmi
        document.getElementById('emiLoanSameTd').innerHTML = '0.00';
        document.getElementById('balanceTenureTd').innerHTML = '0.00';
    } else {
        var loanAmt = parseInt(document.getElementById('loanAmt').value);
        var roi = parseFloat(document.getElementById('roi').value) / 100;
        var loanTenure = parseInt(document.getElementById('loanTenure').value);
        var emiPaid = parseInt(document.getElementById('emiPaid').value);
        var thresholdEle = document.getElementById('threshold');
        var threshold = parseInt(thresholdEle.options[thresholdEle.selectedIndex].value);
        var moratoruimPeriodEle = document.getElementById('moratoriumPeriod');
        var moratoruimPeriod = parseInt(moratoruimPeriodEle.options[moratoruimPeriodEle.selectedIndex].value);

        var resultHTML = "";
        var inputResultHtml = "";

        calculateMoritoriumResult(roi, loanTenure, emiPaid, loanAmt, moratoruimPeriod, threshold).then(moritoriumCalResult => {
            console.log(moritoriumCalResult);
            var output = moritoriumCalResult.output;
            var options = moritoriumCalResult.options;

            var currentLoanEmiTd = document.querySelectorAll('td[data-id="currentEmi"]');
            currentLoanEmiTd.forEach(tdEle => {
                tdEle.innerHTML = "₹ " + getIndianFormat(output.emiIfLoanTenureIncreases);
            });

            var originalBalTenureTd = document.querySelectorAll('td[data-id="originalBalTd"]');
            originalBalTenureTd.forEach(function(tdEle) {
                tdEle.innerHTML = getIndianFormat(output.originalBalanceTenureInMonths);
            });

            document.getElementById('revisedTenure').innerHTML = getIndianFormat(output.revisedBalanceTenureInMonths);
            document.getElementById('extraEmiPaid').innerHTML = getIndianFormat(options["option1"].extraEmi);
            document.getElementById('option-five').innerHTML = "₹ " + getIndianFormat(options["option4"].financialImpact);
            document.getElementById('option-two').innerHTML = "₹ " + getIndianFormat(options["option1"].financialImpact);
            document.getElementById('revisedLoanEmi').innerHTML = "₹ " + getIndianFormat(output.emiIfLoanTenureRemainsSame);

            document.getElementById('revisedLoanEmi').innerHTML = "₹ " + getIndianFormat(output.emiIfLoanTenureRemainsSame);
            document.getElementById('increaseEmiInMonths').innerHTML = "₹ " + getIndianFormat(options["option4"].extraEmi);

            document.getElementById('defermentIntrestTd').innerHTML = getIndianFormat(output.defermentInterest);
            document.getElementById('newPrincipalOsTd').innerHTML = getIndianFormat(output.newPrincipalOutstanding);
            document.getElementById('emiLoanIncreasTd').innerHTML = getIndianFormat(output.emiIfLoanTenureIncreases);
            document.getElementById('emiLoanSameTd').innerHTML = getIndianFormat(output.emiIfLoanTenureRemainsSame);
            document.getElementById('balanceTenureTd').innerHTML = getIndianFormat(output.revisedBalanceTenureInMonths);
            document.getElementById('extraEmiOp1').innerHTML = getIndianFormat(options["option1"].extraEmi);
            document.getElementById('financialImpactOp1').innerHTML = getIndianFormat(options["option1"].financialImpact);
            document.getElementById('extraEmiOp2').innerHTML = getIndianFormat(options["option2"].extraEmi);
            document.getElementById('financialImpactOp2').innerHTML = getIndianFormat(options["option2"].financialImpact);
            document.getElementById('extraEmiOp4').innerHTML = getIndianFormat(options["option4"].extraEmi);
            document.getElementById('financialImpactOp4').innerHTML = getIndianFormat(options["option4"].financialImpact);
        }).catch(function(err) {
            console.log("Something Went Wrong");
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loanAmt').addEventListener('keyup', openCalculation);
    document.getElementById('roi').addEventListener('keyup', openCalculation);
    document.getElementById('loanTenure').addEventListener('keyup', openCalculation);
    document.getElementById('emiPaid').addEventListener('keyup', openCalculation);
    document.getElementById('moratoriumPeriod').addEventListener('change', openCalculation);
    document.getElementById('threshold').addEventListener('change', openCalculation);
});
document.addEventListener('DOMContentLoaded', openCalculation);