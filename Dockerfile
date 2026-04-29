FROM nginx:stable

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*
# Change ownership of nginx-related directories (nginx user already exists in the image)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Create nginx config that runs on port 8080 (non-privileged port)
# TODO Use custom config file and copy it instead, later
RUN sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf

COPY --chown=nginx:nginx ./static/ /usr/share/nginx/html

# Copy custom nginx config (TODO for later)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

USER nginx
