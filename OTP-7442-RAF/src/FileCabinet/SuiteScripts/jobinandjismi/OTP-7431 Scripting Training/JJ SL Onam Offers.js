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
                    form.clientScriptFileId = 3336;
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
                        id: 'custpage_id',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Customer Id'
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
                        filter.push('AND', ['customermain.internalid', 'anyof', name]);
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
                            id: 'custpage_id',
                            line: i,
                            value: searchResults[i].getValue({ name: 'entity', summary: 'GROUP' })
                        });
                        subList.setSublistValue({
                            id: 'custpage_name',
                            line: i,
                            value: searchResults[i].getText({ name: 'entity', summary: 'GROUP' })
                        });
                        // log.debug(searchResults[i].getValue({ name: 'entity', summary: 'GROUP'}));
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
                else{
                    let customerEmail, name;
                    let request = scriptContext.request;
                    let subListId = 'custpage_list1';
                    let lineCount = request.getLineCount({
                        group: 'custpage_list1'
                    });
                    let response;
                    for(let i = 0; i < lineCount; i++){
                        let isChecked = request.getSublistValue({
                            group: subListId,
                            line: i,
                            name: 'custpage_selected'
                        });
                        if(isChecked === 'T'){
                            customerEmail = request.getSublistValue({
                                group: subListId,
                                line: i,
                                name: 'custpage_email'
                            });
                            log.debug('Email fetched', customerEmail);
                            name = request.getSublistValue({
                                group: subListId,
                                line: i,
                                name: 'custpage_name'
                            });
                            log.debug('Customer Name', name);
                            cid = request.getSublistValue({
                                group: subListId,
                                line: i,
                                name: 'custpage_id'
                            });
                            log.debug('Customer Id', cid);
                            if(customerEmail !== "- None -"){
                                email.send({
                                    author: -5,
                                    recipients: cid,
                                    subject: 'Onam Special Offers specially for you!!!!',
                                    body: 'Dear ' + name + ', \n Wishing you and your family a harvest of love, togetherness, and prosperity this Onam. Welcome to the "Onam Special Sale" in our company for which you are an eligible customer.\n\nThank You.'
                                });
                                response += 'Email sent to' + customerEmail + '\n';
                            }
                            else{
                                response += 'Email not sent to ' + name + ', since no email id has been assigned to the customer record.\n';
                            }
                            
                        }
                    }
                    response += '\n\n<< Go back to the previous page <<'
                    scriptContext.response.write(response);
                }
            }catch(e){
                log.debug("Error", e.stack);
                log.debug("Error", e.message);
            }
        }

        return {onRequest}

    });
