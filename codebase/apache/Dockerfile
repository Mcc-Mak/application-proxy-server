FROM httpd:2.4

# Enable required modules
RUN set -eux; \
    for m in \
        proxy_module \
        proxy_http_module \
        auth_basic_module \
        authn_file_module \
        authz_core_module \
        authz_user_module \
        rewrite_module \
        headers_module \
        deflate_module \
        ssl_module ; do \
      sed -ri "s/^#(LoadModule ${m} .*)/\1/" /usr/local/apache2/conf/httpd.conf ; \
    done

COPY vhost.conf /usr/local/apache2/conf/extra/vhost.conf
COPY .htpasswd  /usr/local/apache2/conf/.htpasswd

RUN echo "Include conf/extra/vhost.conf" >> /usr/local/apache2/conf/httpd.conf

EXPOSE 80
