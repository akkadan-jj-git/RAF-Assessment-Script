/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/email', 'N/record', 'N/search'],
    /**
 * @param{email} email
 * @param{record} record
 * @param{search} search
 */
    (serverWidget, email, record, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try{
                if(scriptContext.request.method === 'GET'){
                    let form = serverWidget.createForm({
                        title: 'Selected Customers for Onam Offer'
                    });
                    form.clientScriptFileId = 3331;
                    let fieldGroup = form.addFieldGroup({
                        id: 'custpage_filtersection',
                        label: 'Filters'
                    });
                    let subsidiaryFilter = form.addField({
                        id: 'custpage_subsidiary',
                        label: 'Subsidiary',
                        type: serverWidget.FieldType.SELECT,
                        source: 'subsidiary',
                        container: 'custpage_filtersection'
                    });
                    let customerFilter = form.addField({
                        id: 'custpage_customer',
                        label: 'Customer Name',
                        type: serverWidget.FieldType.SELECT,
                        source: 'customer',
                        container: 'custpage_filtersection'
                    });
    
                    let subList = form.addSublist({
                        id: 'custpage_list1',
                        label: 'Customer Purchase Information',
                        type: serverWidget.SublistType.LIST
                    });
    
                    subList.addField({
                        id: 'custpage_name',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Customer Name'
                    });
                    subList.addField({
                        id: 'custpage_email',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Customer Email Address'
                    });
                    subList.addField({
                        id: 'custpage_totalamount',
                        type: serverWidget.FieldType.CURRENCY,
                        label: 'Total Invoiced Amount'
                    });
                    subList.addField({
                        id: 'custpage_selected',
                        type: serverWidget.FieldType.CHECKBOX,
                        label: 'Select Customer'
                    });
                    form.addSubmitButton({
                        label: 'Send Email'
                    });

                    let sub = scriptContext.request.parameters.subsidiaryValue || '';
                    let name = scriptContext.request.parameters.customerName || '';
    
                    subsidiaryFilter.defaultValue = sub;
                    customerFilter.defaultValue = name;

                    let filter = [
                        ["mainline", "is", "T"],
                        "AND",
                        ["datecreated", "within", "thisyear"],
                        "AND",
                        ["customermain.stage","anyof","CUSTOMER"],
                        "AND",
                        ["amount","greaterthan","1000.00"]
                    ];

                    if(sub){
                        filter.push('AND', ['subsidiary', 'anyof', sub]);
                    }
                    if(name){
                        filter.push('AND', ['name', 'anyof', name]);
                    }
                    log.debug('Filters', filter);
    
                    let invoiceSearch = search.create({
                        type: search.Type.INVOICE,
                        filters: filter,
                        columns:
                        [
                            search.createColumn({
                                name: "entity",
                                summary: "GROUP"
                            }),
                            search.createColumn({
                                name: "amount",
                                summary: "SUM"
                            }),
                            search.createColumn({
                                name: "email",
                                join: "customerMain",
                                summary: "GROUP"
                            })
                        ]
                    });
                     
                    let searchResults = invoiceSearch.run().getRange({
                        start: 0,
                        end: 1000,
                    });
                    log.debug('Count', searchResults.length);
                    for(let i = 0; i < searchResults.length; i++){
                        subList.setSublistValue({
                            id: 'custpage_name',
                            line: i,
                            value: searchResults[i].getText({ name: 'entity', summary: 'GROUP' })
                        });
                        // log.debug(searchResults[i].getText({ name: 'entity', summary: 'GROUP'}));
                        subList.setSublistValue({
                            id: 'custpage_email',
                            line: i,
                            value: searchResults[i].getValue({ name: 'email', join: "customerMain", summary: "GROUP" }) || null
                        });
                        subList.setSublistValue({
                            id: 'custpage_totalamount',
                            line: i,
                            value: searchResults[i].getValue({ name: 'amount', summary: 'SUM' })
                        });
                    }
                    scriptContext.response.writePage(form);
                }
            }catch(e){
                log.debug("Error", e.stack);
                log.debug("Error", e.message);
            }
        }

        return {onRequest}

    });
