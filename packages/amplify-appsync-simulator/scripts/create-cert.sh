sslCreateRootCa() {
	# make directories to work from
	mkdir ~/certs/{server,client,ca,tmp}

	# Create your very own Root Certificate Authority
	openssl genrsa \
	  -out ~/certs/ca/my-root-ca.key.pem \
	  2048

	# Self-sign your Root Certificate Authority
	# Since this is private, the details can be as bogus as you like
	openssl req \
	  -x509 \
	  -new \
	  -sha256 \
	  -nodes \
	  -key ~/certs/ca/my-root-ca.key.pem \
	  -days 3652 \
	  -out ~/certs/ca/my-root-ca.crt.pem \
	  -subj "/C=US/ST=New York/L=Provo/O=Elastrix Signing Authority Inc/CN=${url}"

	# NOTE
	# -nodes means "no-des" which means "no passphrase"
	# -days 3652 means that this example will break about 10 years from now
	return 0
}

sslCreateServerCerts() {
	info "Your public DNS is $url"
	read "  [?] Would you like to use this as the SSL Common Name (CN)? [ Y/n ]: " answer

	if [ -z $answer ]; then
		answer="Y"
	fi

	if [ $answer != "Y" ]; then
		echo
		info "Please enter your domain name i.e. example.com"
		read url
	fi

	echo

	read "  [?] Creating certs for $url ok? [ Y/n ]: " answer

	if [ -z $answer ]; then
	        answer="Y"
	fi

	if [ $answer == "Y" ]; then

		sslCreateRootCa $url

		# make directories to work from
		mkdir ~/certs/{server,client,ca,tmp}

		# Create Certificate for this domain,
		openssl genrsa \
		  -out ~/certs/server/my-server.key.pem \
		  2048

		# Create the CSR
		openssl req -new \
		  -key ~/certs/server/my-server.key.pem \
		  -out ~/certs/tmp/my-server.csr.pem \
		  -subj "/C=US/ST=New York/L=Provo/O=Elastrix Service/CN=${url}"

		echo

		# sign the certs
		sslSignCsr

		info "Certificate generation complete!"
		info "Certificates available in ~/certs"
		echo
		return 0
	else
		info "OK Cancelling, Goodbye!"
		echo
		return 0
	fi
}

sslSignCsr() {

	read "  [?] Do you have a serial file i.e. ~/my-root-ca.srl [ y/N ]: " answer

	if [[ $answer == "N" ]]; then
		sslCa="createserial"
	elif [ -z $answer ]; then
		sslCa="createserial"
	else
		read "  [?] Please enter the full path the your serial file i.e. /home/ubuntu/my-root-ca.srl: " sslSrlPath
		if [ -e "${sslSrlPath}" ]; then
			sslCa="serial ${$sslSrlPath}"
		else
			warn "${sslSrlPath} was not found, cancelling."
			echo
			exit 0
		fi
	fi

	# Sign the request from Device with your Root CA
	openssl x509 \
	  -req -in ~/certs/tmp/my-server.csr.pem \
	  -sha256 \
	  -CA ~/certs/ca/my-root-ca.crt.pem \
	  -CAkey ~/certs/ca/my-root-ca.key.pem \
	  -CA$sslCa \
	  -out ~/certs/server/my-server.crt.pem \
	  -days 1095

	# If you already have a serial file, you would use that (in place of CAcreateserial)
	# -CAserial certs/ca/my-root-ca.srl
	return 0
}

sslCreateServerCerts