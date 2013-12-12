;(function($) {
    var CFM_Form = {
        init: function() {
            // clone and remove repeated field
            $('.edd-checkout-fields').on('click', 'img.fes-clone-field', this.cloneField);
            $('.edd-checkout-fields').on('click', 'img.fes-remove-field', this.removeField);

            $('.edd-checkout-fields-add').on('submit', this.formSubmit);
            $('form#post').on('submit', this.adminPostSubmit);
        },

        cloneField: function(e) {
            e.preventDefault();

            var $div = $(this).closest('tr');
            var $clone = $div.clone();
            // console.log($clone);

            //clear the inputs
            $clone.find('input').val('');
            $clone.find(':checked').attr('checked', '');
            $div.after($clone);
        },

        removeField: function() {
            //check if it's the only item
            var $parent = $(this).closest('tr');
            var items = $parent.siblings().andSelf().length;

            if( items > 1 ) {
                $parent.remove();
            }
        },

        adminPostSubmit: function(e) {
            e.preventDefault();

            var form = $(this),
                form_data = CFM_Form.validateForm(form);

            if (form_data) {
                return true;
            }
        },

        formSubmit: function(e) {
            e.preventDefault();

            var form = $(this),
                submitButton = form.find('input[type=submit]')
                form_data = CFM_Form.validateForm(form);

            if (form_data) {

                // send the request
                form.find('fieldset.fes-submit').append('<span class="fes-loading"></span>');
                submitButton.attr('disabled', 'disabled').addClass('button-primary-disabled');

                $.post(fes_frontend.ajaxurl, form_data, function(res) {
                    // var res = $.parseJSON(res);

                    if ( res.success) {
						 form.before( '<div class="fes-success">' + res.message + '</div>');
						if(res.is_post){
							form.slideUp( 'fast', function() {
								form.remove();
							});
						}
						 
                        //focus
                        $('html, body').animate({
                            scrollTop: $('.fes-success').offset().top - 100
                         }, 'fast');

                        setTimeout(
						function() {
							 window.location = res.redirect_to;
						}, 1000);
                    } else {
                        alert( res.error );
                        submitButton.removeAttr('disabled');
                    }

                    submitButton.removeClass('button-primary-disabled');
                    form.find('span.fes-loading').remove();
                });
            }
        },

        validateForm: function( self ) {

            var temp,
                temp_val = '',
                error = false,
                error_items = [];

            // remove all initial errors if any
            CFM_Form.removeErrors(self);
            CFM_Form.removeErrorNotice(self);

            // ===== Validate: Text and Textarea ========
            var required = self.find('[data-required="yes"]');

            required.each(function(i, item) {
                // temp_val = $.trim($(item).val());

                // console.log( $(item).data('type') );
                var data_type = $(item).data('type')
                    val = '';

                switch(data_type) {
                    case 'rich':
                        var name = $(item).data('id')
                        val = $.trim( tinyMCE.get(name).getContent() );

                        if ( val === '') {
                            error = true;

                            // make it warn color
                            CFM_Form.markError(item);
                        }
                        break;

                    case 'textarea':
                    case 'text':
                        val = $.trim( $(item).val() );

                        if ( val === '') {
                            error = true;

                            // make it warn color
                            CFM_Form.markError(item);
                        }
                        break;

                    case 'select':
                        val = $(item).val();

                        // console.log(val);
                        if ( !val || val === '-1' ) {
                            error = true;

                            // make it warn color
                            CFM_Form.markError(item);
                        }
                        break;

                    case 'multiselect':
                        val = $(item).val();

                        if ( val === null || val.length === 0 ) {
                            error = true;

                            // make it warn color
                            CFM_Form.markError(item);
                        }
                        break;

                    case 'radio':
                        var length = $(item).parent().find('input:checked').length;

                        if ( !length ) {
                            error = true;

                            // make it warn color
                            CFM_Form.markError(item);
                        }
                        break;

                    case 'file':
                        var length = $(item).next('ul').children().length;

                        if ( !length ) {
                            error = true;

                            // make it warn color
                            CFM_Form.markError(item);
                        }
                        break;

                    case 'email':
                        var val = $(item).val();

                        if ( val !== '' ) {
                            //run the validation
                            if( !CFM_Form.isValidEmail( val ) ) {
                                error = true;

                                CFM_Form.markError(item);
                            }
                        }
                        break;


                    case 'url':
                        var val = $(item).val();

                        if ( val !== '' ) {
                            //run the validation
                            if( !CFM_Form.isValidURL( val ) ) {
                                error = true;

                                CFM_Form.markError(item);
                            }
                        }
                        break;

                };

            });

            // if already some error found, bail out
            if (error) {
                // add error notice
                CFM_Form.addErrorNotice(self);

                return false;
            }

            var form_data = self.serialize(),
                rich_texts = [];

            // grab rich texts from tinyMCE
            $('.fes-rich-validation').each(function (index, item) {
                temp = $(item).data('id');
                val = $.trim( tinyMCE.get(temp).getContent() );

                rich_texts.push(temp + '=' + encodeURIComponent( val ) );
            });

            // append them to the form var
            form_data = form_data + '&' + rich_texts.join('&');
            return form_data;
        },

        addErrorNotice: function(form) {
            $(form).find('fieldset.fes-submit').append('<div class="fes-error edd_errors">' + fes_frontend.error_message + '</div>');
        },

        removeErrorNotice: function(form) {
            $(form).find('.fes-error edd_errors').remove();
        },

        markError: function(item) {
            $(item).closest('fieldset').addClass('has-error');
            $(item).focus();
        },

        removeErrors: function(item) {
            $(item).find('.has-error').removeClass('has-error');
        },

        isValidEmail: function( email ) {
            var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
            return pattern.test(email);
        },

        isValidURL: function(url) {
            var urlregex = new RegExp("^(http:\/\/www.|https:\/\/www.|ftp:\/\/www.|www.|http:\/\/|https:\/\/){1}([0-9A-Za-z]+\.)");
            return urlregex.test(url);
        },
    };

    $(function() {
        CFM_Form.init();
    });

})(jQuery);