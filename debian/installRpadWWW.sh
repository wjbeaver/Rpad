#!/bin/sh
# This installs the extra server files for Rpad on Debian.
# The defaults are to install to /var/www/Rpad.
# usage:
#   installRpadWWW.sh directory tree
# examples: 
#   installRpadWWW.sh /var/www/Rpad 
#   installRpadWWW.sh /var/www/Rpad /testingdir
#   installRpadWWW.sh /var/www/anotherdir

RPAD=/var/www/Rpad
TREE=/.
if [ $# -eq 1 ]; then
  RPAD=$1
fi
if [ $# -eq 2 ]; then
  RPAD=$1
  TREE=$2
fi

# copy the base files
mkdir -p $TREE$RPAD
cp -r inst/basehtml/* $TREE$RPAD
cp -r inst/basehtml/.* $TREE$RPAD

# fix the directory permissions
chmod a+w $TREE$RPAD
chmod a+w $TREE$RPAD/server
chmod a+x $TREE$RPAD/server/*.pl

# this link makes the help menu work
ln -s /usr/lib/R $TREE$RPAD/R

# apache configuration file (cgi or mod_perl)
mkdir -p $TREE/etc/apache2/conf.d
cat > $TREE/etc/apache2/conf.d/Rpad << EOF
<Directory $RPAD/server*>  
  <IfModule mod_perl.c>
    <Files *.pl> # requires mod_perl
      SetHandler perl-script
      PerlResponseHandler ModPerl::PerlRun
      PerlOptions +ParseHeaders
      Options -Indexes +ExecCGI
    </Files>
  </IfModule>
  Options +ExecCGI
  AddHandler cgi-script .pl
  <IfModule mod_expires.c>
    ExpiresActive on
    ExpiresDefault "now plus 0 seconds"
  </IfModule>
</Directory>
AddType text/x-component .htc
AddType text/html .Rpad
EOF

# apache2 configuration file (cgi or mod_perl)
mkdir -p $TREE/etc/apache/conf.d
cat > $TREE/etc/apache/conf.d/Rpad << EOF
<Directory $RPAD/server*>  
  <IfModule mod_perl.c>
    <Files *.pl> # requires mod_perl
      SetHandler perl-script
      PerlHandler Apache::Registry
      Options +ExecCGI
      PerlSendHeader ON
    </Files>
  </IfModule>
  Options +ExecCGI
  AddHandler cgi-script .pl
  <IfModule mod_expires.c>
    ExpiresActive on
    ExpiresDefault "now plus 0 seconds"
  </IfModule>
</Directory>
AddType text/x-component .htc
AddType text/html .Rpad
EOF

