// BUDGET CONTROLLER
var budgetController = (function() {

    // constructor functions for Income and Expense objects
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    // adding function to Expense's prototype to calculate percentage property
    Expense.prototype.calculatePercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    // internal data structure containing all budget data
    var data = {
        transLists: {
            inc: [],
            exp: []
        },
        totals: {
            inc: 0,
            exp: 0
        },
        budget: 0,
        percentage: -1
    };

    // calculate total income/expense based on passed type by looping through corresponding array and saving to data.totals
    var calculateTotal = function(type) {
        var sum = 0;
        data.transLists[type].forEach(function(item) {
            sum += item.value;
        });
        data.totals[type] = sum;
    }

    // return object containing public functions
    return {
        addItem: function(type, desc, val) {
            var newItem, ID;

            // create ID for new transaction item based on id of last item in sorted transaction list
            if (data.transLists[type].length === 0) {
                ID = 0;
            } else {
                ID = data.transLists[type][data.transLists[type].length - 1].id + 1;
            }

            // create either Income or Expense item based on type of new item
            if (type === 'inc') {
                newItem = new Income(ID, desc, val);
            } else if (type === 'exp') {
                newItem = new Expense(ID, desc, val);
            }

            // add new item to data
            data.transLists[type].push(newItem);
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, deleteIndex;

            // map array of income/expense elements to array of each element's id #
            ids = data.transLists[type].map(function(element) {
                return element.id;
            });

            // find index of id to be deleted, and delete it if found
            deleteIndex = ids.indexOf(id);

            if (deleteIndex !== -1) {
                data.transLists[type].splice(deleteIndex, 1);
            }
        },

        calculateBudget: function() {
            // calculate total income and expenses
            calculateTotal('inc');
            calculateTotal('exp');

            // calculate budget (income-expenses)
            data.budget = data.totals.inc - data.totals.exp;

            // calculate percentage (expenses/income)
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function() {
            // for each exp item in data array, calculate its percentage property
            data.transLists.exp.forEach(function(item) {
                item.calculatePercentage(data.totals.inc);
            });
        },

        getBudget: function() {
            // return object with all 4 budget values
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },

        getPercentages: function() {
            // return array of each expense item's percentage property
            var allExpPercentages = data.transLists.exp.map(function(item) {
                return item.percentage;
            });
            return allExpPercentages;
        },

        // testing function to reveal internal data object
        // display: function() {
        //     console.log(data);
        // }
    };

})();


// UI CONTROLLER
var uiController = (function() {
    // object containing all relevant DOM elements to allow single-point class-name edits
    var DOMelements = {
        inputType: document.querySelector('.add__type'),
        inputDescription: document.querySelector('.add__description'),
        inputValue: document.querySelector('.add__value'),
        inputButton: document.querySelector('.add__btn'),
        
        incContainer: document.querySelector('.income__list'),
        expContainer: document.querySelector('.expenses__list'),
        
        budgetValue: document.querySelector('.budget__value'),
        incValue: document.querySelector('.budget__income--value'),
        expValue: document.querySelector('.budget__expenses--value'),
        expPercentage: document.querySelector('.budget__expenses--percentage'),

        itemsContainer: document.querySelector('.container'),
        dateLabel: document.querySelector('.budget__title--month'),

        // just class-name text, as elements are created on-the-fly, so setting it initially would always return empty NodeList
        expItemPercentLabel: '.item__percentage'
    };

    // create custom forEach function for NodeLists to apply the callback function on each element in NodeList
    var nodeListForEach = function(list, callbackFunc) {
        for (var i=0; i<list.length; i++) {
            callbackFunc(list[i], i);
        }
    };

    // formatters using JS Internationalization API
    var currencyFormat = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});

    var monthFormat = new Intl.DateTimeFormat('default', {month: 'long', year: 'numeric'});

    // custom formatter for values to add +/- based on item type
    var formatNumber = function(num, type) {
        return (type === 'inc'? '+' : '-') + ' ' + currencyFormat.format(num);
    };

    // return object containing public functions
    return {
        getInput: function() {
            // return object with data from user input fields
            return {
                type: DOMelements.inputType.value,
                description: DOMelements.inputDescription.value,
                value: parseFloat(DOMelements.inputValue.value)
            };
        },

        // add an Income/Expense object to display
        addListItem: function(obj, type) {
            var htmlString, container;

            // set corresponding container DOM element and html string based on obj type
            if (type === 'inc') {
                container = DOMelements.incContainer;

                htmlString = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                container = DOMelements.expContainer;
                
                htmlString = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // fill html string with corresponding values from obj
            htmlString = htmlString.replace('%id%', obj.id).replace('%description%', obj.description).replace('%value%', formatNumber(obj.value, type));

            // insert html string in appropriate position
            container.insertAdjacentHTML('beforeend', htmlString);
            
            // clear user fields and focus on descriptions field
            this.clearUserFields();
        },

        // delete Income/Expense object from display
        deleteListItem: function(itemID) {
            var deleteElement = document.getElementById(itemID);
            deleteElement.parentNode.removeChild(deleteElement);
        },

        // clear user input fields
        clearUserFields: function() {
            DOMelements.inputDescription.value = '';
            DOMelements.inputValue.value = '';
            DOMelements.inputDescription.focus();
        },

        // update budget display labels on top
        displayBudget: function(obj) {
            // do not use custom formatter for budget because it can be negative naturally
            DOMelements.budgetValue.textContent = currencyFormat.format(obj.budget);
            DOMelements.incValue.textContent = formatNumber(obj.totalInc, 'inc');
            DOMelements.expValue.textContent = formatNumber(obj.totalExp, 'exp');
            if (obj.percentage > 0) {
                DOMelements.expPercentage.textContent = obj.percentage + '%';
            } else {
                DOMelements.expPercentage.textContent = '---';
            }
        },

        // update all expense items' percentage labels
        displayPercentages: function(percentages) {
            // query for all item__percentage elements, returns NodeList
            var expItemPercentLabels = document.querySelectorAll(DOMelements.expItemPercentLabel);

            // for each item in NodeList, update its percentage label text
            nodeListForEach(expItemPercentLabels, function(item, index) {
                if (percentages[index] > 0) {
                    item.textContent = percentages[index] + '%';
                } else {
                    item.textContent = '---';
                }
            });
        },

        // update month label based on current month
        displayMonth: function() {
            DOMelements.dateLabel.textContent = monthFormat.format(new Date());
        },

        // toggle blue/red formatting based on inc/exp in inputType element
        changedType: function() {
            DOMelements.inputType.classList.toggle('red-focus');
            DOMelements.inputDescription.classList.toggle('red-focus');
            DOMelements.inputValue.classList.toggle('red-focus');

            DOMelements.inputButton.classList.toggle('red');
        },

        // public function to pass access to DOM elements object
        getDOMelements: function() {
            return DOMelements;
        }
    };
})();


// GLOBAL APP CONTROLLER
var appController = (function(budgetCtrl, uiCtrl) {
    // set up all event listeners, called in init()
    var setupEventListeners = function() {
        var DOMelements = uiCtrl.getDOMelements();

        DOMelements.inputButton.addEventListener('click', appAddItem);

        document.addEventListener('keypress', function(event) {
            if (event.keyCode === 13 || event.which === 13) appAddItem();
        });

        DOMelements.itemsContainer.addEventListener('click', appDeleteItem);

        DOMelements.inputType.addEventListener('change', uiCtrl.changedType);
    };

    var appAddItem = function() {
        var input, newItem;

        // get input field data
        input = uiCtrl.getInput();
        
        if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
            // add item to budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            
            // add item to ui
            uiCtrl.addListItem(newItem, input.type);

            // calculate and update budget display
            updateBudget();

            // calculate and update percentages display
            updatePercentages();
        } else {
            alert('Please enter a valid entry.');
        }
    };

    var appDeleteItem = function(event) {
        var itemID, type, ID;

        // get id tag of item from descendent node delete button
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        // split id tag of item into item's type and id #
        if (itemID) {
            type = itemID.split('-')[0];
            ID = parseInt(itemID.split('-')[1]);

            // delete item from data structure in budget controller
            budgetCtrl.deleteItem(type, ID);

            // delete item from ui
            uiCtrl.deleteListItem(itemID);

            // calculate and update budget display
            updateBudget();

            // calculate and update percentages display
            updatePercentages();
        }
    };

    var updateBudget = function() {
        // calculate the budget
        budgetCtrl.calculateBudget();

        // return the budget
        var budget = budgetCtrl.getBudget();

        // display the budget
        uiCtrl.displayBudget(budget);
    };

    var updatePercentages = function() {
        // calculate new percentages
        budgetCtrl.calculatePercentages();

        // return new percentages
        var percentages = budgetCtrl.getPercentages();

        // display new percentages
        uiCtrl.displayPercentages(percentages);
    };

    // return object with public function init() to initialize application
    return {
        // log starting message, update month, reset budget displays, and set up event listeners
        init: function() {
            console.log('Application started.');
            uiCtrl.displayMonth();
            uiCtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };

})(budgetController, uiController);


// start application
appController.init();
