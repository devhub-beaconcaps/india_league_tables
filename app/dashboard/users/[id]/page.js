import React from 'react'

const page = async({params}) => {

  const { id } = await params;
  return (
    <div>
      user {id} is here
    </div>
  )
}

export default page
